import { Card, DropZone, LegacyStack, Thumbnail, Page, Layout, TextContainer, Text, Button, TextField, Grid, ChoiceList, Spinner } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {NoteMinor} from '@shopify/polaris-icons';
import {useState, useCallback, useMemo, useEffect} from 'react';
import axios from 'axios';

import { DataGrid, useGridApiRef} from '@mui/x-data-grid';

import { useAuthenticatedFetch } from "../hooks";


const columns = [

  { field: "itemName", headerName: "Item Name", width: 300, editable: true },
  { field: "description", headerName: "Description", width: 180, editable: true },
  { field: "image", headerName: "Image", width: 120, editable: true,
  renderCell: (params) => (
    <img src={params.value} height={50} />
  )  
  },
  { field: "barcode", headerName: "Barcode", width: 120, editable: true },
  { field: "price", headerName: "Cost ($)", type: 'number', editable: true },
  { field: "quantity", headerName: "Quantity", type: 'number', editable: true },
  { field: "vendor", headerName: "Vendor", width: 100, editable: true },
  // { field: "prodCat", headerName: "Product Category", width: 100, editable: true },
  { field: "type", headerName: "Type", width: 60, editable: true },
  // { field: "custom", headerName: "Custom", type: 'boolean', editable: true },
  { field: "sku", headerName: "SKU", width: 120, editable: true },
  { field: "color", headerName: "Color", width: 100, editable: true },
  { field: "size", headerName: "Size", width: 100, editable: true },
  // { field: "hscode", headerName: "HS Code", width: 60, editable: true },
  // { field: "discdol", headerName: "Discount ($)", type: 'number', editable: true },
  // { field: "discpc", headerName: "Discount (%)", type: 'number', editable: true },
  // { field: "ageGroup", headerName: "Age Group", width: 60, editable: true },
  // { field: "gender", headerName: "Gender", width: 60, editable: true }

];


const INVICIBACKURL = 'https://invici-zone-2.inviciai.com';
const INVICIBACKURLPTD = INVICIBACKURL + '/pdf_table_det';
const INVICIBACKURLPDFTODF = INVICIBACKURL + '/pdf_to_df';
const INVICIBACKURLFINDF = INVICIBACKURL + '/final_df';


var _nidx = 0

const genNProdIdx = () => {
  // const oldIdxState = nidxState
  // setNidxState(nidxState + 1)
  var oidx = _nidx
  _nidx = _nidx+1;
  return oidx;
};



export default function InvoiceUpload() {
  const [files, setFiles] = useState([]);
  const [rows, setRows] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(['']);
  const [procApiLoading, setProcApiLoading] = useState(false);
  const [finApiLoading, setFinApiLoading] = useState(false);
  const [procId, setProcId] = useState("");
  const [uploadResults, setUploadResults] = useState("");
  const [shopInfo, setShopInfo] = useState({});
  const [subscriptionInfo, setSubcriptionInfo] = useState({})
  const [pdfDfErr, setPdfDfErr] = useState("");
  const [prodUploadErr, setProdUploadErr] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [nidxState, setNidxState] = useState(0);
  const [cellEditField, setCellEditField] = useState("");

  const fetch = useAuthenticatedFetch();
  
  const handleLocChange = useCallback((value) => setSelectedLoc(value), []);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) => {
      const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setPdfDfErr("Please upload a PDF file");
      setPdfError(true);
    } else {
      setPdfDfErr("");
      setPdfError(false);
      setFiles((files) => [...files, ...pdfFiles]);
    }
  },
  [],
);

const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    getAllLocs();
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
    const file = files[0];
    var formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(INVICIBACKURLPDFTODF,
        formData,
        {
            headers: {
            'Content-Type': 'multipart/form-data',
            'Shop-ID': shopInfo.id,
          }
        }
      );
      if (res.status == 200) {
        var records = res.data.table;
        setProcId(res.data.proc_id);
        records = records.map(x => ({...x, id:genNProdIdx()}));
        console.log(res.data)
        setRows(records);
      }
    } catch (error) {
      setPdfDfErr("There was an error while doing this operation, please check your inputs and try again later.");
      console.log("There was an error doing this operation")
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

  const createProd = async () => {
    setFinApiLoading(true);
    const productMap = apiRef.current.getRowModels();
    console.log(productMap);
    var productArr = [];
    productMap.forEach((v) => {
      productArr.push(v);
    })
    // if this fails, it doesn't matter to notify user
    try {
      const r1 = axios.post(INVICIBACKURLFINDF, {table: productArr, proc_id: procId});
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
            productArr: productArr
          }),
      }).then(response => 
        response.json().then(data => ({
            data: data,
            status: response.status
        })
      ).then(res => {
          console.log("res update")
          setUploadResults(`${res.data.successfuls.length} items successfully created. ${res.data.failures.length} failed to be created in draft products.`)
          console.log(res.data)
      }));
      console.log(res);
    } catch (err) {
      console.error(err);
      setProdUploadErr("There was an error while uploading the product information to shopify, we're sorry for the inconvenience.");
    }
    setFinApiLoading(false);
  }

  const apiRef = useGridApiRef();

  
  const onRowsSelectionHandler = (ids) => {
    setSelectedRowIds(ids);
  };

  const deleteSelectedRows = () => {
    // const remainingRows = ids.map((id) => rows.find((row) => row.id === id));
    const curRows = apiRef.current.getRowModels();
    selectedRowIds.forEach(i => {
      curRows.delete(i);
    })
    setRows(Array.from(curRows.values()));

  }

  const addRow = () => {
    const curRows = apiRef.current.getRowModels();
    var rowArr = Array.from(curRows.values())
    const nids = genNProdIdx();
    rowArr.push({
      id: nids,
      itemName: "",
      description: "",
      image: "",
      barcode: "",
      price: 0.00,
      quantity: 0,
      vendor: "",
      prodCat: "",
      type: "",
      custom: false,
      sku: "",
      color: "",
      size: "",
      hscode: "",
      ageGroup: "",
      gender: ""
    })
    setRows(rowArr);
  }

  const cellEditStopHandler = (n, e) => {
    setCellEditField(n.field)
    e.defaultMuiPrevented = false;
    apiRef.current.stopCellEditMode({ id: n.id, field: n.field });
  }

  const rowProcUpdate = (e, o) => {
    console.log(e)
    console.log(o)
    console.log(e[cellEditField])
    console.log(cellEditField)

    const curRows = apiRef.current.getRowModels();
    selectedRowIds.forEach(i => {
      let row = curRows.get(i);
      row[cellEditField] = e[cellEditField]
      curRows.set(i, row)
    })
    curRows.set(e.id, e)
    console.log(curRows)
    console.log(e)
    setRows(Array.from(curRows.values()));
    return e
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


  if (Object.keys(subscriptionInfo).length == 0) return (
    <Page narrowWidth>
    <TitleBar title="Invici" primaryAction={null} />
    <Layout>
      <Layout.Section>
        <Card sectioned>  
            Loading...
        </Card>
      </Layout.Section>
    </Layout>
  </Page>
  )



  if (subscriptionInfo.currentAppInstallation.activeSubscriptions.length == 0) return (
    <Page narrowWidth>
      <TitleBar title="Invici" primaryAction={null} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
              <Layout.Section oneThird>
                Please go to the main page and start a subscription to use this App.
              </Layout.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );

  return (
    <Page fullWidth>
      <TitleBar
        title="Upload Invoice"
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
              Upload Invoice
            </Text>
            <TextContainer>
              <p>Upload invoices for processing:</p>
            </TextContainer>
            <br />
            <DropZone onDrop={handleDropZoneDrop}>
              {uploadedFiles}
              {fileUpload}
            </DropZone>
            <Button onClick={pdfTableDetApi}>Upload Invoices for Processing  </Button>
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


          {/* Table Detection Card */}
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
            {finApiLoading &&  <><Spinner accessibilityLabel="Loading Final Update" size="small" /> <Text> This may take some time.</Text></>}
            {uploadResults && <p>{uploadResults}</p>}
            {prodUploadErr!="" && prodUploadErr}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
