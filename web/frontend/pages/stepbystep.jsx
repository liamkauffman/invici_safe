import { Card, DropZone, LegacyStack, Thumbnail, Page, Layout, TextContainer, Text, Button, TextField, Grid, ChoiceList, Spinner } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {NoteMinor} from '@shopify/polaris-icons';
import {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import axios from 'axios';

import { DataGrid, useGridApiRef} from '@mui/x-data-grid';

import { useAuthenticatedFetch } from "../hooks";
import TableEditor from "../components/structure/TableEditor";
import ExtrTable from "../components/extrEditing/ExtrTable";
import ListingTable from "../components/listingTable/ListingTable";
import { baseUrl } from "../apis/baseUrl";




const INVICIBACKURL = baseUrl;
const INVICIBACKURLPTD = INVICIBACKURL + '/pdf_table_det';
const INVICIBACKURLPDFTODF = INVICIBACKURL + '/pdf_to_df';
const INVICITDETTOEXTR = INVICIBACKURL + '/det_to_extr';
const INVICIEXTRTODFJSON = INVICIBACKURL + '/extr_to_df'
const INVICIBACKURLFINDF = INVICIBACKURL + '/final_df';

const INVICIBACKURLPDFTOSTRUCT = INVICIBACKURL + '/pdf_to_struct';


var _nidx = 0

const genNProdIdx = () => {
  // const oldIdxState = nidxState
  // setNidxState(nidxState + 1)
  var oidx = _nidx
  _nidx = _nidx+1;
  return oidx;
};



export default function StepByStep() {
  
  const [files, setFiles] = useState([]);

  const [imgsWStructure, setImgsWStructure] = useState([]);

  const [detsToExtrLoading, setDetsToExtrLoading] = useState(false);
  const [extrTable, setExtrTable] = useState([]);
  const [detsToExtrErr, setDetsToExtrErr] = useState("");

  const [extrToDFJsonLoading, setExtrToDFJsonLoading] = useState(false);
  const [dfJson, setDFJson] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [dfJsonErr, setDfJsonErr] = useState("");

  const [prodApiLoading, setProdApiLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState("");
  const [resupplyResults, setResupplyResults] = useState("");


  const [storeProducts, setStoreProducts] = useState([]);

  // refs
  const uploadRef = useRef(null);
  const tableDetRef = useRef(null);
  const extrTableRef = useRef(null);
  const prodTableRef = useRef(null);
  const uploadResRef = useRef(null);



  // const handleImagesStructureChange = (imageStructure, idx) => {
  //   console.log('triggered')
  //   let items = [...this.state.imgsWStructure];
  //   items[idx] = imageStructure;
  //   setImgsWStructure(items);
  // }

  const [rows, setRows] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(['']);
  const [procApiLoading, setProcApiLoading] = useState(false);
  const [finApiLoading, setFinApiLoading] = useState(false);
  const [procId, setProcId] = useState("");
  const [shopInfo, setShopInfo] = useState({});
  const [subscriptionInfo, setSubcriptionInfo] = useState({})
  const [pdfDfErr, setPdfStructErr] = useState("");
  const [prodUploadErr, setProdUploadErr] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [nidxState, setNidxState] = useState(0);
  const [cellEditField, setCellEditField] = useState("");

  const fetch = useAuthenticatedFetch();
  
  const handleLocChange = useCallback((value) => setSelectedLoc(value), []);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) => {
      const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length == 0) {
      setPdfStructErr("Please upload a PDF file.");
      setPdfError(true);
    } else if (pdfFiles.length > 1) {
      setPdfStructErr("Please upload only 1 PDF file.")
    }
    else {
      setPdfStructErr("");
      setPdfError(false);
      setFiles([...pdfFiles]);
    }
  },
  [],
);

const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    getAllLocs();
    getStoreProducts();

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




  const pdfTableDetApi = async () => {
    setProcApiLoading(true);
    setImgsWStructure([]);
    setExtrTable([]);
    setDetsToExtrErr("");
    setDFJson([]);
    setDfJsonErr("");

    const file = files[0];
    var formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(INVICIBACKURLPDFTOSTRUCT,{
          body: formData,
          method: 'POST'
        });
      // axios.post(INVICIBACKURLPDFTOSTRUCT,
      //   formData,
      //   {
      //       headers: {
      //       'Content-Type': 'multipart/form-data',
      //       'Shop-ID': shopInfo.id,
      //     }
      //   }
      // );
      if (res.status == 200) {
        var data = await res.json();
        console.log(res)
        console.log(data)
        console.log(data.iws)
        setImgsWStructure(data.iws);
        setProcId(data.procId)
        // var records = res.data.table;
        // setProcId(res.data.proc_id);
        // records = records.map(x => ({...x, id:genNProdIdx()}));
        // console.log(res.data)
        // setRows(records);
        setPdfStructErr("");
      }
      else {
        console.log(res)
      }
      tableDetRef.current.scrollIntoView({behavior: 'smooth'})
    } catch (error) {
      setPdfStructErr("There was an error while doing this operation, please check your inputs and try again later.");
      console.log("There was an error doing this operation")
      console.error(error);
    }
    setProcApiLoading(false);
    // console.log(res.data);
  }



  const getAllLocs = async () => {
    const res = await fetch('/api/locations/all').then(response => 
        response.json().then(data => ({
            data: data,
            status: response.status
        })
    ).then(res => {
        console.log(res.data.data);
        setLocations(res.data.data);
        setSelectedLoc(res.data.data[0].admin_graphql_api_id)
    }));
  };

  const getStoreProducts = async () => {
    const res = await fetch('/api/products/all').then(response=> 
        response.json().then( data => ({
            data: data,
            status: response.status
        })).then(res => {
          console.log(res.data.data);
          setStoreProducts(res.data.data);
        })
      )
  }


  const detsToExtr = async (imgs, dims, coordinates, padding) => {
    setDetsToExtrLoading(true);
    setExtrTable([]);
    setDetsToExtrErr("");
    setDFJson([]);
    setDfJsonErr("");
    console.log(dims)
    console.log(coordinates)
    try {
      const postData = {imgs, dims, coordinates, "usr_padding": padding, "proc_id": procId};
      const res = await fetch(INVICITDETTOEXTR,{
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData),
        method: 'POST'
      });
      console.log(res)
      // const res = await axios.post(INVICITDETTOEXTR, postData);
      if (res.status == 200) {
        console.log(res)
        var data = await res.json();
        var concated_table = []
        if ('extr_table' in data) {
          data.extr_table.forEach(x => {
            concated_table = concated_table.concat(x)
          })
        }
        setExtrTable(concated_table);
        console.log(data)
        // setImgsWStructure(data);
        setDetsToExtrErr("")
        extrTableRef.current.scrollIntoView({behavior: 'smooth'})
      } else {
        setDetsToExtrErr("There was an error during the scanning of the table. Please check your inputs, if the problem persists please try again later. We are sorry for the inconvenience.")
        console.log(res)
      }
    } catch (error) {
      setDetsToExtrErr("There was an error during the scanning of the table. Please check your inputs, if the problem persists please try again later. We are sorry for the inconvenience.")
      console.log("There was an error doing this operation")
      console.error(error)
    }
    // console.log(res.data);
    setDetsToExtrLoading(false);
  }

  const extrToDFJson = async (extrTable) => {
    setDFJson([]);
    setProductOptions([]);
    setDfJsonErr("");
    setExtrToDFJsonLoading(true)
    try {
      const postData = {extrTable, storeProducts, "proc_id": procId};
      // const res = await axios.post(INVICIEXTRTODFJSON, postData);
      const res = await fetch(INVICIEXTRTODFJSON,{
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData),
        method: 'POST'
      });
      if (res.status == 200) {
        var data = await res.json();
        console.log(data);
        setDFJson(data.table)
        setProductOptions([{query_title: "", variant_id: "", prod_id: ""}].concat(data.resupply_json))
        setDfJsonErr("");
      }
      prodTableRef.current.scrollIntoView({behavior: 'smooth'})
    } catch (error) {
      console.log("There was an error doing this operation")
      console.error(error)
      setDfJsonErr("There was an error processing the table, please check your input or try again later. Make sure the header is included in the scanned table. If it was not detected, add a row to the top, and label columns with the exact headers shown on the table in the pdf.")
    }
    setExtrToDFJsonLoading(false)
    // console.log(res.data);
  }

  const createProd = async (productArr) => {
    console.log(productArr)
    const createArr = [];
    const resupplyArr = [];
    productArr.forEach(x => {
      if (x.resupply == true) resupplyArr.push(x)
      else createArr.push(x)
    })
    setProdApiLoading(true);
    // if this fails, it doesn't matter to notify user
    try {
        // const r1 = axios.post(INVICIBACKURLFINDF, {table: productArr, "proc_id": procId});
        const postData = {table: productArr, "proc_id": procId}
        fetch(INVICIBACKURLFINDF,{
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData),
          method: 'POST'
        });
        
    } catch (err) {
        console.error(err)
    }
    try {
        const res = await fetch("/api/products/bulkcreate" , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location: locations[0].admin_graphql_api_id,
                productArr: createArr,
                procId: procId
            }),
        }).then(response => 
            response.json().then(data => ({
                data: data,
                status: response.status
            })
        ).then(res => {
            console.log("res update")
            setUploadResults(`${res.data.successfuls.length} items successfully created. ${res.data.failures.length} failed to be created in draft products.  Please ensure the table is properly filled in accordance to the invoice and edit the incorrect fields.`)
            console.log(res.data)
        }));
        console.log(res);
        setProdUploadErr("");
    } catch (err) {
        console.error(err);
        setProdUploadErr("There was an error while uploading the product information to shopify, we're sorry for the inconvenience.");
    }

    try {
      const pushResArr = []
      console.log(productOptions)
      resupplyArr.forEach(x => {
        let tmp = productOptions.find(prod => prod.query_title == x.resupply_title)
        pushResArr.push({vid: tmp.variant_id, qty: x.quantity, pid: tmp.prod_id })
      })
      const res = await fetch("/api/products/resupply" , {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              location: locations[0].admin_graphql_api_id,
              procId: procId,
              variantArr: pushResArr
          }),
      }).then(response => 
          response.json().then(data => ({
              data: data,
              status: response.status
          })
      ).then(res => {
          console.log("RESUPPLY update")
          // setUploadResults(`${res.data.successfuls.length} items successfully created. ${res.data.failures.length} failed to be created in draft products.`)
          if (res.status >= 400) {
              setResupplyResults("Error in resupplying products, we are sorry for the inconvenience. Please ensure the table is properly filled in accordance to the invoice and edit the incorrect fields.")
          } else {
            const { successful_resupplies, failed_resupplies} = res.data
            setResupplyResults(`${successful_resupplies.length} resupplies succeeded, ${failed_resupplies.length} failed.`)
          }
          console.log(res.data)
      }));
      console.log(res);
      setProdUploadErr("");
  } catch (err) {
      console.error(err);
      setProdUploadErr("There was an error while uploading the resupply information to shopify, we're sorry for the inconvenience.");
  }

    uploadResRef.current.scrollIntoView({behavior: 'smooth'})
    setProdApiLoading(false);
    }



  const validImageTypes = ['image/jpeg', 'image/png', 'document/pdf'];
  const fileUpload = !files.length && <DropZone.FileUpload />;
  const uploadedFiles = files.length > 0 && (
    <div style={{padding: '0'}}>
      <LegacyStack vertical>
        {files.map((file, index) => (
          <LegacyStack alignment="center" key={index}>
            <Thumbnail
              size="small"
              alt={file.name}
              source={
                validImageTypes.includes(file.type)
                  ? window.URL.createObjectURL(file)
                  : NoteMinor
              }
            />
            <div>
              {file.name}{' '}
              <Text variant="bodySm" as="p">
                {file.size} bytes
              </Text>
            </div>
          </LegacyStack>
        ))}
      </LegacyStack>
    </div>
  );


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
  //             <Layout.Section oneThird>
  //               Please go to the main page and start a subscription to use this App.
  //             </Layout.Section>
  //         </Card>
  //       </Layout.Section>
  //     </Layout>
  //   </Page>
  // );

  return (
    <Page fullWidth>
      <TitleBar
        title="Process Invoice - Step by Step"
        // primaryAction={{
        //   content: "Primary action",
        //   onAction: () => console.log("Primary action"),
        // }}
        // secondaryActions={[
        //   {
        //     content: "Secondary action",
        //     onAction: () => console.log("Secondary action"),
        //   },
        // ]}
      />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text variant="headingMd" as="h2">
              Welcome to the Invoice Processing Page. 
            </Text>
            <Text>
            Upload an invoice below to get started. If your workflow results in a major error, refresh the page to restart the workflow.
            </Text>
          </Card>
          <Card sectioned>
            <div ref={uploadRef}></div>
            <TextContainer>
              <p>Upload an Invoice:</p>
            </TextContainer>
            <br />
            <DropZone onDrop={handleDropZoneDrop}>
              {uploadedFiles}
              {fileUpload}
            </DropZone>
            *We only support PDFs right now.
            <br />
            <br />
            <Button onClick={pdfTableDetApi}>Upload Invoice for Processing  </Button>
            <br />
            {procApiLoading &&  <Spinner accessibilityLabel="Loading Conversion" size="small" />}
            {/* render pdf error message if pdfError is true */}
          {pdfError && <p style={{color: "red"}}>PDF submissions only</p>}
          {/* render pdfDfErr message if pdfDfErr is not empty */}
          {pdfDfErr!="" && <p style={{color: "red"}}>{pdfDfErr}</p>}
          </Card>

          <Card sectioned>
          <ChoiceList
            title="Choose location to update inventory:"
            choices={locations.map(x => {
              return {
                label: x.name,
                value: x.admin_graphql_api_id
                }
              }
            )}
            selected={selectedLoc}
            onChange={handleLocChange}
          />
          </Card>
          { imgsWStructure.length != 0 &&
          <Card sectioned>
              <div ref={tableDetRef}></div>
              <Text>Please ensure the table was correctly detected. Drag the top left + and bottom right + to edit the detected table zone.</Text>
              <br />
              <Text>If a page does not contain a table, please click "Delete Page".</Text>
              <br />
              <Text as="span" fontWeight="semibold">Ensure the header of the table is the first row.</Text>
              <br />
              <Text>When complete with all pages, click the "Submit for Extraction" button below.</Text>
              <br />
              <TableEditor images={imgsWStructure} detsToExtr={detsToExtr}/>
              <br />
              {detsToExtrErr!="" && <p style={{color: "red"}}>{detsToExtrErr}</p>}
              {detsToExtrLoading &&  <><Spinner accessibilityLabel="Loading Conversion" size="small" /> This may take some time.</>}
          </Card>
          }
          {
            extrTable.length != 0 && 
            <Card sectioned>
              <div ref={extrTableRef}></div>
              <Text>The results from our extraction are listed below.</Text>
              <Text>Please review the extraction fields to ensure the table was read correctly. Filling in missing information will increase the accuracy of the following processing step. You can bulk edit fields by highlighting the rows you want to edit and change a field, which will apply to all selected rows*.</Text>
              <br/>
              <Text as="span" fontWeight="semibold">Ensure the header of the table is the first row.</Text>
              <br />
              <Text> Double Click a cell to edit it.</Text>
              <br />
              <br />
              <Text>*When finished editing a cell PLEASE PRESS ENTER to finish editing to avoid errors of changing other rows.</Text>
              <ExtrTable extrTable={extrTable} extrToDFJson={extrToDFJson} />
              {dfJsonErr!="" && <p style={{color: "red"}}>{dfJsonErr}</p>}
              {extrToDFJsonLoading &&  <><Spinner accessibilityLabel="Loading Conversion" size="small" /> Creating the listing table!</>}
            </Card>
          }

          {dfJson.length != 0 && productOptions.length != 0 &&
          <Card sectioned>
            <Text> The results from extraction are below. Please edit incorrect fields, then click Process Products.</Text>
            {/* <Text> Please review each item's information. When complete, click 'Process Products' below the table to push the item to the drafts section of your inventory, or resupply if specified. Item's pushed from Invici's pages will also have the tag "invici".</Text>
            <Text> If an item is to be resupplied, ensure that the resupply checkbox is selected and that a resupply variant has been chosen. If a product is resupplied, only the quantity of the product will be adjusted.</Text> */}
            <div ref={prodTableRef}></div>
            <ListingTable productOptions={productOptions} dfJson={dfJson} createProd={createProd} />
            {prodApiLoading &&  <Spinner accessibilityLabel="Loading Final Update" size="small" />}
            {uploadResults != "" && <Text>New products processed have been tagged with: "inv-{procId}". </Text>}
            <br/>
            {uploadResults!="" && uploadResults}
            <br />
            {resupplyResults!="" && resupplyResults}
            <div ref={uploadResRef}></div>
          </Card>
          }


          {/* Table Detection Card
          <Card sectioned>
            <Text variant="headingMd" as="h2">
              Table Detection
            </Text>
            <br />
            <Button destructive onClick={deleteSelectedRows}>Delete Selected Rows</Button>
            <Button onClick={addRow}>Add Row</Button>
            <br />
            <br />
            <DataGrid apiRef={apiRef} rows={rows} columns={columns} checkboxSelection 
            onCellEditStop={cellEditStopHandler} 
            processRowUpdate={rowProcUpdate} 
            onRowSelectionModelChange={(ids) => onRowsSelectionHandler(ids)} />
            <br />
            <Button onClick={createProd}> Add To Store</Button>
            <br />
            {finApiLoading &&  <Spinner accessibilityLabel="Loading Final Update" size="small" />}
            {uploadResults && <p>{uploadResults}</p>}
            {prodUploadErr!="" && prodUploadErr}
          </Card> */}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
