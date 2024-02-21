import { Button } from '@shopify/polaris';
import React, { Component, useEffect, useRef, useState } from 'react';
import Draggable, {DraggableCore} from "react-draggable";
import DragBox from './DragBox';
// import Panel from './Panel';

export default function ImageEdit(props) {
    const { img } = props?.image;
    const { width, height } = props?.imgDims;

    const { imgTableCoordinates, idx, handleNewBoundsChange} = props;

    // const nwidth = 800;
    // const nheight = (height/width) * nwidth; 

    // // const [nrows, setRows] = useState([]);
    // // const [ncols, setCols] = useState([]);

    // useEffect(() => {
    //     let singleRows = rows.map(x => (x[0])/height * nheight )
    //     singleRows.push(rows[rows.length-1][1]/height * nheight );
    //     console.log(singleRows)
    //     setRows(singleRows);

    //     let singleCols = cols.map(x => (x[0])/width * nwidth)
    //     singleCols.push(cols[cols.length-1][1]/width * nwidth );
    //     console.log(singleCols)
    //     setCols(singleCols);
    //     console.log(width)
    //     console.log(height)
    //     // console.log(nwidth)
    //     // console.log(nheight)
    // }, []);

    const handleLog = (e) => {
        console.log(e)
    }


    // const [path, setPath] = useState([
    //     { lat: 52.52549080781086, lng: 13.398118538856465 },
    //     { lat: 52.48578559055679, lng: 13.36653284549709 },
    //     { lat: 52.48871246221608, lng: 13.44618372440334 }
    // ]);

    // Define refs for Polygon instance and listeners
    // const polygonRef = useRef(null);
    // const listenersRef = useRef([]);
      // Call setPath with new edited path
    // const onEdit = useCallback(() => {
    //     if (polygonRef.current) {
    //     const nextPath = polygonRef.current
    //         .getPath()
    //         .getArray()
    //         .map(latLng => {
    //         return { lat: latLng.lat(), lng: latLng.lng() };
    //         });
    //     setPath(nextPath);
    //     }
    // }, [setPath]);
    // const onLoad = useCallback(
    //     polygon => {
    //       polygonRef.current = polygon;
    //       const path = polygon.getPath();
    //       listenersRef.current.push(
    //         path.addListener("set_at", onEdit),
    //         path.addListener("insert_at", onEdit),
    //         path.addListener("remove_at", onEdit)
    //       );
    //     },
    //     [onEdit]
    //   );
    // const onUnmount = useCallback(() => {
    //     listenersRef.current.forEach(lis => lis.remove());
    //     polygonRef.current = null;
    // }, []);

    // console.log("The path state is", path);
    


    // return (
    //     <div
    //     style={{  
    //         backgroundImage: `url('data:image/jpeg;base64,${img}')`,
    //         backgroundPosition: 'center',
    //         backgroundSize: 'cover',
    //         backgroundRepeat: 'no-repeat'
    //       }}>

    //       </div>

    // )



    // const saveChange = () => {
    //     props.handleImagesStructureChange({}, 0);
    // }
    const myStyle={
        position: "relative",
        backgroundImage: 
        `url('data:image/jpeg;base64,${img}')`,
        height:height,
        width: width,
        // marginTop:'-70px',
        fontSize:'50px',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
    };
    return (
      <>
      <div style={myStyle}>
        <DragBox idx={idx} handleNewBoundsChange={handleNewBoundsChange} coordinates={imgTableCoordinates}  />
      </div>
      </>
    );

}