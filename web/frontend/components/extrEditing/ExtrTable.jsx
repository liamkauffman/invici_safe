import { useGridApiRef} from '@mui/x-data-grid';
import { DataGridPro } from '@mui/x-data-grid-pro';
import {useState, useCallback, useMemo, useEffect} from 'react';
import { Card, DropZone, LegacyStack, Thumbnail, Page, Layout, TextContainer, Text, Button, TextField, Grid, ChoiceList, Spinner } from "@shopify/polaris";

export default function ExtrTable(props) {

    const {extrTable, extrToDFJson} = props;

    const [rows, setRows] = useState([]);
    const [prodUploadErr, setProdUploadErr] = useState("");
    const [selectedRowIds, setSelectedRowIds] = useState([]);
    const [nidxState, setNidxState] = useState(0);
    const [cellEditField, setCellEditField] = useState("");


    const columns = extrTable[0].map((x,i) => {
        return { field: `${i}`, headerName: `Column ${i}`, width: 160, editable: true}
    })

    useEffect(()=> {

        let objectified_rows = extrTable.map((x, ri) => {
            let obj = {id: ri}
            for (let i=0; i < extrTable[0].length; i++) obj[i] = x[i];
            return obj
        })
        setNidxState(extrTable.length)
        console.log(objectified_rows)
        setRows(objectified_rows)
    }, [])
//     const columns = [

//         { field: "itemName", headerName: "Item Name", width: 300, editable: true },
//         { field: "description", headerName: "Description", width: 180, editable: true },
//         { field: "image", headerName: "Image", width: 120, editable: true,
//         renderCell: (params) => (
//         <img src={params.value} height={50} />
//         )  
//         },
//         { field: "barcode", headerName: "Barcode", width: 120, editable: true },
//         { field: "price", headerName: "Cost ($)", type: 'number', editable: true },
//         { field: "quantity", headerName: "Quantity", type: 'number', editable: true },
//         { field: "vendor", headerName: "Vendor", width: 100, editable: true },
//         // { field: "prodCat", headerName: "Product Category", width: 100, editable: true },
//         { field: "type", headerName: "Type", width: 60, editable: true },
//         // { field: "custom", headerName: "Custom", type: 'boolean', editable: true },
//         { field: "sku", headerName: "SKU", width: 120, editable: true },
//         { field: "color", headerName: "Color", width: 100, editable: true },
//         { field: "size", headerName: "Size", width: 100, editable: true },
//         // { field: "hscode", headerName: "HS Code", width: 60, editable: true },
//         // { field: "discdol", headerName: "Discount ($)", type: 'number', editable: true },
//         // { field: "discpc", headerName: "Discount (%)", type: 'number', editable: true },
//         // { field: "ageGroup", headerName: "Age Group", width: 60, editable: true },
//         // { field: "gender", headerName: "Gender", width: 60, editable: true }
  
//   ];

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

  const addRowTop = () => {
    const curRows = apiRef.current.getRowModels();
    var rowArr = Array.from(curRows.values())
    console.log(rowArr)
    let nRow = {id: nidxState};
    setNidxState(nRow.id + 1);
    for (let j = 0; j < rowArr[0].length; j++) nRow[j] = ""
    rowArr.unshift(nRow)
    setRows(rowArr);
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

  const uploadExtr = () => {
    const curRows = apiRef.current.getRowModels();
    var rowArr = Array.from(curRows.values())
    // console.log(rowArr)
    let nExtrTable = []
    rowArr.forEach(x => {
        let tmp = []
        for(let i = 0; i < extrTable[0].length; i++) tmp.push(x[i])
        nExtrTable.push(tmp)
    })
    extrToDFJson(nExtrTable);
    console.log(nExtrTable)
  }

  
    


    return <>
        <Text variant="headingMd" as="h2">
        Table Detection
        </Text>
        <br />
        <Button destructive onClick={deleteSelectedRows}>Delete Selected Rows</Button>
        <Button onClick={addRow}>Add Row Bottom</Button><Button onClick={addRowTop}>Add Row Top</Button>
        <br />
        <br />
        <DataGridPro apiRef={apiRef} rows={rows} columns={columns} checkboxSelection 
        onCellEditStop={cellEditStopHandler} 
        processRowUpdate={rowProcUpdate} 
        onRowSelectionModelChange={(ids) => onRowsSelectionHandler(ids)} />
        <br />
        <Button onClick={uploadExtr}> Convert To Listing Table</Button>
        <br />
    </>

}