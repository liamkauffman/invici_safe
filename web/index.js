// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";
import axios from "axios";


const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);
// console.log(shopify.config.webhooks.path)
// console.log(shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers }));

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (req, res) => {
  const lastSync = req.query.since;
  const countReq = {
    session: res.locals.shopify.session,
  }
  if (lastSync != 'never') countReq['updated_at_min'] = lastSync;
  console.log(lastSync)
  const countData = await shopify.api.rest.Product.count(countReq);
  res.status(200).send(countData);
});

app.get("/api/products/all", async (_req, res) => {
  // const prodData = await shopify.api.rest.Product.count({
  //   session: res.locals.shopify.session,
  // });
  // shopify.api.rest.Product.
  const prodData = await shopify.api.rest.Product.all({
    session: res.locals.shopify.session
  })
  res.status(200).send(prodData);
})

app.get("/api/products/gqlAll", async (req, res) => {
  try {
    const session = res.locals.shopify.session
    const client = new shopify.api.clients.Graphql({session});
    console.log("CURSOR")
    console.log(req.query)
    const gqlq = `{
      products(first: 20 ${(( req?.query?.since && typeof(req.query.since)=='string' && req.query.since != 'never') ? ', query: "updatedAt:>=' + req.query.since.split("T")[0] + '" ' : '')} ${(( req?.query?.cursor ) ? ', after: "' + req.query.cursor + '" ' : '')}) {
        edges {
          cursor
          node {
            id
            title
            vendor
            variants(first: 10) {
              edges {
                node {
                  title
                  id
                  sku
                }
              }
            }
          }
        }
      }
    }`
    console.log(gqlq)
    const data = await client.query({ data: gqlq});
    if ('body' in data) res.status(200).send(data.body);
    else res.sendStatus(501)
  } catch (error) {
    console.log("ERROR::")
    console.log(error)
    res.sendStatus(500)
  }
  // console.log(data.body.extensions)
});



app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.post("/api/products/resupply", async(req, res) => { 
  try{
    console.log("resupplying items")
    if(!req?.body?.variantArr) return res.status(400).json({'message': 'variants to update required'})
    if(!req?.body?.location) {
      console.log('no location field')
      return res.status(400).json({ 'message': 'field is required'})
    }
    const {variantArr, location, procId} = req.body;
    console.log("Location")
    console.log(location)
    const location_id = location.split("/").at(-1)
    console.log("RESUPLY variant arr:")
    console.log(variantArr)
    const session = res.locals.shopify.session;
    const successful_resupplies = []
    const failed_resupplies = []
    const client = new shopify.api.clients.Graphql({session});
    for(let i = 0; i < variantArr.length; i++) {
      const x = variantArr[i]
      try {
        let { vid, qty, pid } = x
        console.log(x)
        const v = await shopify.api.rest.Variant.find({session, id: vid.split('/').at(-1)});
        try {
          console.log("TAG UPDATE")
          console.log(pid);
          console.log(procId)
          const data = await client.query({
            data: {
              "query": `mutation addTags($id: ID!, $tags: [String!]!) {
                tagsAdd(id: $id, tags: $tags) {
                  node {
                    id
                  }
                  userErrors {
                    message
                  }
                }
              }`,
              "variables": {
                "id": pid,
                "tags": `inv-${procId}`
              },
            },
          });
        } catch(e){
          console.error(e)
        }
        console.log(v)
        const inv_item_id = v?.inventory_item_id
        const invLevel = await shopify.api.rest.InventoryLevel.all({
          session: session,
          location_ids: location_id,
          inventory_item_ids: inv_item_id
        });
        console.log("INV LEVELS")
        console.log(invLevel)
        const inventory_level = new shopify.api.rest.InventoryLevel({session: session});

        //if inventory doesnt exist, first create.
        if (!('inventory_levels' in invLevel && Array.isArray(invLevel.inventory_levels) && invLevel.inventory_levels.length > 0)) {
          const connect_inv = await inventory_level.connect({
            body: {"location_id": location_id, "inventory_item_id": inv_item_id},
          });
          console.log(connect_inv)
        } 
        const ilevel = await inventory_level.adjust({
          body: {"location_id": location_id, "inventory_item_id": inv_item_id, "available_adjustment": qty},
        });
        console.log(ilevel)
        console.log(v)
        successful_resupplies.push(x);

      } catch (error) {
        console.log(error)
        failed_resupplies.push(x)
      }
    }
    res.status(201).send({successful_resupplies, failed_resupplies})
  } catch (error) {
    res.sendStatus(500)
  }

})

app.post("/api/products/bulkcreate", async( req, res) => {
  console.log('attempt bulk create');
  // console.log(req.body);
  if(!req?.body?.productArr) {
    console.log('no products field')
    return res.status(400).json({ 'message': 'field is required'})
  }
  if(!req?.body?.location) {
    console.log('no location field')
    return res.status(400).json({ 'message': 'field is required'})
  }
  const {productArr, location, procId} = req.body;
  // "seo": {
  //   "description": "",
  //   "title": ""
  // },
  // "tags": [
  //   ""
  // ],
  


  let status = 200;
  let error = null;
  let reses = [];
  let successfuls = [];
  let failures = [];
  let errors = [];
  try {
    const session = res.locals.shopify.session
    const client = new shopify.api.clients.Graphql({session});
    for(const prod of productArr) {
      try {
        let options = []
        var variant_fs = []
        if (prod.color && prod.color != "") {
          options.push("Color")
          variant_fs.push(prod.color)
        }
        if (prod.size && prod.size != "") {
          options.push("Size")
          variant_fs.push(prod.size)
        }
        if (options.length == 0) {
          options.push("Option")
          variant_fs.push(prod.name);
        }
        let options_str = ''
        if (options.length != 0) options_str = `options: ["${options.join('", "')}"],`;
        let vs = '';
        if (variant_fs.length != 0) vs = `options: ["${variant_fs.join('", "')}"],`;
      
        var nprod = `mutation {
            productCreate(
              input: {
                title: "${prod.itemName}",
                productType: "${prod.type}",
                vendor: "${prod.vendor}",
                status: DRAFT,
                images: [{
                  altText: "image of ${prod.itemName}",
                  src: "${prod.image}"
                }],
                ${options_str != '' && options_str}
                descriptionHtml: "<p>${prod.description}</p>",
                tags: [
                  "invici",
                  "inv-${procId}"
                ],    
                variants: [
                  {
                    barcode: "${prod.barcode}",
                    inventoryItem: {
                      cost: "${prod.price}"
                      tracked: true
                    },
                    price: "${prod.storePrice}",
                    ${vs != '' && vs}
                    inventoryQuantities: [
                      {
                        availableQuantity: ${prod.quantity},
                        locationId: "${location}"
                      },
                    ],
                    inventoryManagement: SHOPIFY,
                    sku: "${prod.sku}",
                  }
                ]
              }) {
              product {
                id
              }
              userErrors {
                field
                message
              }        
            }
          }`
          const data = await client.query({
            data: nprod,
          });
          // console.log(data);
          reses.push(data);
          successfuls.push(prod.itemName);
          console.log(`item create sucess`);
          console.log(data)
        }
        catch(err) {
          failures.push(prod.itemName);
          console.log(`item create failed`);
          console.error(err)
          errors.push(err);
        }   
    }
  } catch(err) {
    console.error(`failed to process request ${err}`)
    status = 500
    error = err.message
  }
  // console.log(reses);
  res.status(status).send({ sucess: status === 200, successfuls, failures, reses, errors, error });
});

app.get("/api/shopInfo", async(_req, res) => {
  const shopInfo = await shopify.api.rest.Shop.all({session: res.locals.shopify.session});
  console.log(shopInfo);
  res.status(200).send(shopInfo);
})

app.get("/api/subscription", async(_req, res) => {
  const query =  `{currentAppInstallation {
      activeSubscriptions {
        status
      }
  }}`;
  const session = res.locals.shopify.session
  const client = new shopify.api.clients.Graphql({session});
  try {
    const gqlres = await client.query({data: query})
    console.log(gqlres);
    res.status(200).send(gqlres.body);
  } catch (err) {
    console.log(err)
    res.sendStatus(500);
  }
})

app.post("/api/createSubscription", async(req, res) => {
  console.log(req.body)
  if(!req?.body?.redirUrl) {
    console.log('no redirUrl field')
    return res.status(400).json({ 'message': 'redirUrl Required'})
  }
  console.log("CREATING SUBSCRIPTION")
  const session = res.locals.shopify.session;
  // const recurring_application_charge = new shopify.api.rest.RecurringApplicationCharge({session: session});
  // recurring_application_charge.name = "Starter Plan";
  // recurring_application_charge.price = 10.0;
  // recurring_application_charge.return_url = req.body.redirUrl;
  // recurring_application_charge.trial_days = 5;
  // const data = await recurring_application_charge.save({
  //   update: true,
  // });
  // console.log(data);
  // res.send(data)
  const client = new shopify.api.clients.Graphql({session});
  try {

    const data = await client.query({
      data: {
        "query": `mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean!) {
          appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
            userErrors {
              field
              message
            }
            appSubscription {
              id
            }
            confirmationUrl
          }
        }`,
        "variables": {
          "name": "Basic",
          "returnUrl": req.body.redirUrl,
          "lineItems": [
            {
              "plan": {
                "appRecurringPricingDetails": {
                  "price": {
                    "amount": 10,
                    "currencyCode": "USD"
                  },
                  "interval": "EVERY_30_DAYS"
                }
              }
            }
          ],
          "test": false
        }
      },
    }).catch(error => {
      console.log("ERROR MAKING SUBSCRIPTION")
      console.log("ERROR 1:")
      console.log(error)
      console.log("Error 2:")
      console.log(error.errors)
    });
    console.log(data);
    res.status(200).send(data);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
  // ,
  // "test": true
})


app.get("/api/locations/all", async (_req, res) => {
  const locations = await shopify.api.rest.Location.all({
    session: res.locals.shopify.session,
  });
  // const countData = await shopify.api.rest.Product.count({
  //   session: res.locals.shopify.session,
  // });
  res.status(200).send(locations);
});

app.get("/api/my_shop_data", async(_req, res) => {
  console.log("SESSION")
  console.log(res.locals.shopify.session)
  const { accessToken } = res.locals.shopify.session;
  // const nres = await axios.get("https://google.com");
  const url = "https://invici-zone-1.inviciai.com/my_shop_data"
  axios.post(url, {accessToken}).then(res => {
    console.log(res)
  }).catch(err => {
    console.error(err)
    console.log(url)
  })
  
  console.log(res.locals.shopify.session.accessToken)
  res.status(200).send()
})






app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
