import { useGridApiRef, useGridApiContext } from '@mui/x-data-grid';
import { DataGridPro } from '@mui/x-data-grid-pro';
import {useState, useCallback, useMemo, useEffect} from 'react';
import { Card, DropZone, LegacyStack, Thumbnail, Page, Layout, TextContainer, Text, Button, Grid, ChoiceList, Spinner } from "@shopify/polaris";

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';



export default function ListingTable(props) {
  console.log(props.productOptions)
  const query_titles = []
  props.productOptions.forEach(x => {
    if (!query_titles.includes(x.query_title))
    query_titles.push(x.query_title);
  })


  // query_titles = new Set(query_titles)
  // query_titles = Array.from(query_titles)
  // props.
  // const set = new Set(props.productOptions.map(x => x.query_title))
  const columns = [

    { field: "itemName", headerName: "Item Name (Required)", width: 300, editable: true },
    { field: "resupply", headerName: "Resupply", width: 100, type: 'boolean', editable: true },
    { field: "resupply_title", headerName: "Resupply Variant Title", width: 300, editable: true,
      renderEditCell: (params) => (
        <Autocomplete
          disablePortal
          id="combo-box-demo"
          // const { id, value, field } = params;
          value={params.value}
          onChange={(event, newValue) => {
            apiRef.current.setEditCellValue({ id: params.id, field: params.field, value: newValue });
            // setValue(newValue);
          }}
          options={query_titles}
          sx={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Resupply Product" />}
        />
      // <CustomEditComponent {...params} />
    ),},
    { field: "description", headerName: "Description", width: 180, editable: true, render: rowData => (<div dangerouslySetInnerHTML={{__html: rowData}} />)},
    { field: "image", headerName: "Image", width: 120, editable: true,
    renderCell: (params) => (
      <img src={params.value} height={50} />
    )  
    },
    { field: "barcode", headerName: "Barcode", width: 120, editable: true },
    { field: "price", headerName: "Cost ($)", type: 'number', editable: true },
    { field: "storePrice", headerName: "Price ($)", type: 'number', editable: true },
    { field: "quantity", headerName: "Quantity", type: 'number', editable: true },
    { field: "vendor", headerName: "Vendor", width: 100, editable: true },
    // { field: "prodCat", headerName: "Product Category", width: 100, editable: true },
    { field: "type", headerName: "Type", width: 60, editable: true },
    // { field: "custom", headerName: "Custom", type: 'boolean', editable: true },
    { field: "sku", headerName: "SKU", width: 120, editable: true },
    { field: "color", headerName: "Color", width: 100, editable: true },
    { field: "size", headerName: "Size", width: 100, editable: true },
    
    // { field: "resupply_variant", headerName: "Resupply Variant ID", width: 100, editable: true },

    // { field: "hscode", headerName: "HS Code", width: 60, editable: true },
    // { field: "discdol", headerName: "Discount ($)", type: 'number', editable: true },
    // { field: "discpc", headerName: "Discount (%)", type: 'number', editable: true },
    // { field: "ageGroup", headerName: "Age Group", width: 60, editable: true },
    // { field: "gender", headerName: "Gender", width: 60, editable: true }
  
  ];



    const { dfJson, createProd } = props;
    const [rows, setRows] = useState([]);
    const [prodUploadErr, setProdUploadErr] = useState("");
    const [selectedRowIds, setSelectedRowIds] = useState([]);
    const [nidxState, setNidxState] = useState(0);
    const [cellEditField, setCellEditField] = useState("");



    const apiRef = useGridApiRef();

    useEffect(() => {
        setNidxState(dfJson.length)
        let records = dfJson.map((x, j) => ({...x, id:j}));
        setRows(records);
    },[])

  
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
      console.log(rowArr)
      let nRow = {id: nidxState};
      setNidxState(nRow.id + 1);
      for (let j = 0; j < rowArr[0].length; j++) nRow[j] = ""
      rowArr.push(nRow)
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

    const pushProducts = () => {
        const productMap = apiRef.current.getRowModels();
        console.log(productMap);
        var productArr = [];
        productMap.forEach((v) => {
        productArr.push(v);
        })
        createProd(productArr);
        console.log("Push Products")
    }


   


  

    return <>
        <Text variant="headingMd" as="h2">
        Listing Table
        </Text>
        <br />
        <Button destructive onClick={deleteSelectedRows}>Delete Selected Rows</Button>
        <Button onClick={addRow}>Add Row</Button>
        <br />
        <Text as="p" fontWeight="bold">
          Total Quantity of Items: {rows.map(x => x.quantity).reduce((a,b)=> {
            console.log(a)
            return Number(a)+Number(b)
            }, 0)}
        </Text>
        <Text as="p" fontWeight="bold">
          Total Cost of Items: ${rows.map(x => Number(x.quantity) * Number(x.price)).reduce((a,b)=> {
            console.log(a)
            return a+b
            }, 0)}
        </Text>
        <br />
        <div style={{ height: 600, width: '100%' }}>
        <DataGridPro apiRef={apiRef} rows={rows} columns={columns} checkboxSelection 
        onCellEditStop={cellEditStopHandler} 
        processRowUpdate={rowProcUpdate} 
        onRowSelectionModelChange={(ids) => onRowsSelectionHandler(ids)} />
        </div>
        <br />
        <Button onClick={pushProducts}> Process Products</Button>
        <br />
    </>
}

