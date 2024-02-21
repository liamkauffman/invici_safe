import {
    Card,
    Page,
    Layout,
    TextContainer,
    Image,
    Stack,
    Link,
    Text,
    Button,
  } from "@shopify/polaris";
  import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
  import { useAuthenticatedFetch } from "../hooks";
  
  import { trophyImage } from "../assets";
  
  import { ProductsCard } from "../components";
  
  import { BillingCard } from "../components/BillingCard";
  import { useEffect, useState } from "react";
  import { Redirect } from "@shopify/app-bridge/actions";
  import { createApp } from "@shopify/app-bridge";
  import { syncApi } from "../apis";
  
  export default function HomePage() {
  
    const bridge = useAppBridge();
    const [shopInfo, setShopInfo] = useState({});
    const [subscriptionInfo, setSubcriptionInfo] = useState({});
    const [syncStatus, setSyncStatus] = useState("");
    const fetch = useAuthenticatedFetch();
  
    useEffect(() => {
      console.log("Starting Invici")
      fetch("/api/shopInfo").then(response => 
        response.json().then(data => ({
            data: data,
            status: response.status
        })
      ).then(res => {
        setShopInfo(res.data.data[0]);
          // console.log(res.data.data);
      }));
      fetch("/api/subscription").then(response => 
        response.json().then(data => ({
            data: data,
            status: response.status
        })
      ).then(res => {
        setSubcriptionInfo(res.data?.data);
        console.log(res.data.data);
      }));
  
  
    }, []);
  
    useEffect(() => {
      // if (Object.keys(subscriptionInfo).length != 0 && subscriptionInfo.currentAppInstallation.activeSubscriptions.length != 0) {
        const { syncStoreProds } = syncApi()
        console.log(shopInfo)
        if ('id' in shopInfo) syncStoreProds(fetch, shopInfo, setSyncStatus)
      // }
    }, [shopInfo])
  
    const config = {
        // The client ID provided for your application in the Partner Dashboard.
        apiKey: "2fcccc565930048e89d396d48ed990df",
        // The host of the specific shop that's embedding your app. This value is provided by Shopify as a URL query parameter that's appended to your application URL when your app is loaded inside the Shopify admin.
        host: new URLSearchParams(location.search).get("host"),
        forceRedirect: true
    };
  
    const app = createApp(config);
    const redirect = Redirect.create(app);
  
  
    const createSubscription = async () => {
      console.log("creating Subscription");
      console.log(bridge.hostOrigin)
      console.log(shopInfo)
      const redirUrl = `${bridge.hostOrigin}/store/${shopInfo.name}/apps/${'invici'}`
      console.log(redirUrl)
      const res = await fetch("/api/createSubscription", {
        method: 'POST',        
        headers: { 'Content-Type': 'application/json',}, 
        body: JSON.stringify({redirUrl: redirUrl}) }).then(response => 
        response.json().then(data => ({
            data: data,
            status: response.status
        })
      ).then(res => {
          console.log(res.data)
          const cUrl = res.data.body.data.appSubscriptionCreate.confirmationUrl;
          redirect.dispatch(Redirect.Action.REMOTE, cUrl);
          // console.log(cUrl)
      }));
    }
  
    const move_to_iu = () => {
      redirect.dispatch(Redirect.Action.APP, "/invoiceupload")
    }
    const move_to_inviciaicom = () => {
      redirect.dispatch(Redirect.Action.REMOTE, "https://www.inviciai.com")
    }
    const move_to_stepbystep = () => {
      redirect.dispatch(Redirect.Action.APP, "/stepbystep")
    }
  
    // if (Object.keys(subscriptionInfo).length == 0) return (
    //   <Page narrowWidth>
    //   <TitleBar title="Invici" primaryAction={null} />
    //   <Layout>
    //     <Layout.Section>
    //       <Card sectioned>  
    //           Loading...
    //       </Card>
    //     </Layout.Section>
    //   </Layout>
    // </Page>
    // )
  
    // if (subscriptionInfo.currentAppInstallation.activeSubscriptions.length == 0 || subscriptionInfo.currentAppInstallation.activeSubscriptions[0].status != "ACTIVE") return (
    //   <Page narrowWidth>
    //     <TitleBar title="Invici" primaryAction={null} />
    //     <Layout>
    //       <Layout.Section>
    //         <Card sectioned>
    //           <Stack
    //             wrap={false}
    //             spacing="extraTight"
    //             distribution="trailing"
    //             alignment="center"
    //           >
    //             <Layout.Section oneThird>
    //               <BillingCard
    //                 title="Welcome To Invici!"
    //                 description="Click to start a new subscription to Invici's services."
    //                 onClick={createSubscription}
    //               />
    //             </Layout.Section>
    //             {/* <Stack.Item fill>
    //               <TextContainer spacing="loose">
    //                 <Text as="h2" variant="headingMd">
    //                   Nice work on building a Shopify app 🎉
    //                 </Text>
    //                 <p>
    //                   Your app is ready to explore! It contains everything you
    //                   need to get started including the{" "}
    //                   <Link url="https://polaris.shopify.com/" external>
    //                     Polaris design system
    //                   </Link>
    //                   ,{" "}
    //                   <Link url="https://shopify.dev/api/admin-graphql" external>
    //                     Shopify Admin API
    //                   </Link>
    //                   , and{" "}
    //                   <Link
    //                     url="https://shopify.dev/apps/tools/app-bridge"
    //                     external
    //                   >
    //                     App Bridge
    //                   </Link>{" "}
    //                   UI library and components.
    //                 </p>
    //                 <p>
    //                   Ready to go? Start populating your app with some sample
    //                   products to view and test in your store.{" "}
    //                 </p>
    //                 <p>
    //                   Learn more about building out your app in{" "}
    //                   <Link
    //                     url="https://shopify.dev/apps/getting-started/add-functionality"
    //                     external
    //                   >
    //                     this Shopify tutorial
    //                   </Link>{" "}
    //                   📚{" "}
    //                 </p>
    //               </TextContainer>
    //             </Stack.Item>
    //             <Stack.Item>
    //               <div style={{ padding: "0 20px" }}>
    //                 <Image
    //                   source={trophyImage}
    //                   alt="Nice work on building a Shopify app"
    //                   width={120}
    //                 />
    //               </div>
    //             </Stack.Item> */}
    //           </Stack>
    //         </Card>
    //       </Layout.Section>
    //     </Layout>
    //   </Page>
    // );
    // else console.log(subscriptionInfo.currentAppInstallation.activeSubscriptions);
  
    return (
      <Page narrowWidth>
      <TitleBar title="Invici" primaryAction={null} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text>
              Synchronizing your store: {syncStatus}
              <br />
              PLEASE DO NOT CLOSE THIS PAGE until the synchronization is complete.
              <br />
              This shouldn't take long if you've synchronized recently.
            </Text>
          </Card>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Layout.Section oneThird>
  
                <Text>
                  Welcome to Invici Beta! You can try to using our invoice upload page, which will attempt to gather all the information for a product in one go. Alternatively, you can also use our Step By Step page to take you through the process to provide a more accurate result.
                </Text>
                {/* <Button onClick={move_to_iu}>Click for Invoice Upload Page!</Button><br /><br /> */}
                <Button onClick={move_to_stepbystep}>Click Here To Process Your Invoice!</Button>
                <br /><br />
                <BillingCard
                  title="Welcome To Invici Beta"
                  description="Click here to learn more about Invici!"
                  onClick={move_to_inviciaicom}
                />
              </Layout.Section>
            </Stack>
          </Card>
          
        </Layout.Section>
      </Layout>
    </Page>
    )
  }
  