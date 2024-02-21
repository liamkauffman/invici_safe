import React, { Component, useCallback, useEffect } from 'react';
import {Button, RangeSlider} from '@shopify/polaris';
import ImageEdit from './ImageEdit';
import { useState } from 'react';

export default function TableEditor(props) {
    const { images, detsToExtr} = props;
    const [deletedIdxs, setDeletedIdxs] = useState([]);
    const [idx, setIdx] = useState(0);

    const [imgDims, setImgDims] = useState([{width: 0, height: 0}])
    const [tableCoordinates, setTableCoordinates] = useState([{x1: 0, y1: 0, x2: 100, y2: 100}]);
    const [currentImage, setCurrentImage] = useState(images[0])

    const [rangeValue, setRangeValue] = useState(50);

    const handleRangeSliderChange = useCallback(
      (value) => setRangeValue(value),
      [],
    );
    useEffect(() => {
        //Initial table coordinates

        setImgDims(images.map(x => {
            const { img, rows, cols, width, height } = x; 
            const nwidth = 800;
            const nheight = (height/width) * nwidth; 
            return {width: nwidth, height: nheight}
        }));

        setTableCoordinates(images.map(x => {
            const { img, rows, cols, width, height } = x;
            const nwidth = 800;
            const nheight = (height/width) * nwidth; 
            return {
                x1: (cols[0][0])/height * nheight,
                x2: (cols[cols.length-1][1])/height * nheight,
                y1: (rows[0][0])/width * nwidth,
                y2: (rows[rows.length-1][1])/width * nwidth
            }
        }));
    }, [])

    const decrementPage = () => {
        if (idx > 0) {
            let nidx = idx-1
            console.log(nidx)
            while (deletedIdxs.includes(nidx)) nidx-=1;
            console.log(nidx)
            if (nidx >= 0) {
                setCurrentImage(images[nidx])
                setIdx(nidx)
            }
        }
    }
    const incrementPage = () => {
        if (idx < images.length-1) {
            let nidx = idx + 1;
            console.log(nidx)
            while (deletedIdxs.includes(nidx)) nidx+=1;
            console.log(nidx)
            if (nidx < images.length) {
                setCurrentImage(images[nidx])
                setIdx(nidx)
            }
        }
    }
    const deletePage = () => {
        let dixs = [...deletedIdxs];
        dixs.push(idx);
        if (images.filter((e, i) => !dixs.includes(i)).length == 0) {
            setIdx(-1);
            return
        }
        else {
            let available = images.map((e, i) => {
                if (!dixs.includes(i)) return i
            })
            console.log(available)
            setCurrentImage(images[available[0]]);
            setIdx(available[0]);
        }
        setDeletedIdxs(dixs);

        // let tbc = [...tableCoordinates];
        // tbc.splice(idx, 1);

        // let idims = [...imgDims];
        // idims.splice(idx, 1);
        // setImgDims(idims);
        // setTableCoordinates(tbc);
        
    }
    const handleNewBoundsChange = (idx, newCoordinates) => {
        let tbc = [...tableCoordinates];
        tbc[idx] = newCoordinates;
        setTableCoordinates(tbc);
    }

    const submitNewTable = () => {
        // resize coordinates
        
        // definitely a better way to do this but not atm bc I'm crunched for time
        const imgsToGo = images.map((x, i) => x.img).filter((e, i) => !deletedIdxs.includes(i));
        
        const tableCoordinatesToGo = images.map((x, i) => {
            let nwidth = x.width
            let nheight = x.height
            let {width, height} = imgDims[i]

            const ncords = {
                x1: (tableCoordinates[i].x1)/height * nheight,
                x2: (tableCoordinates[i].x2)/height * nheight,
                y1: (tableCoordinates[i].y1)/width * nwidth,
                y2: (tableCoordinates[i].y2)/width * nwidth
            }
            return ncords
        }).filter((e, i) => !deletedIdxs.includes(i));
        const dimsToGo = images.map((x, i) => {
            let {width, height} = x;
            return {
                width,
                height
            }
            // imgDims[i]
        }).filter((e, i) => !deletedIdxs.includes(i));

        // console.log(imgsToGo)
        console.log("TCs")
        console.log(tableCoordinates)
        console.log(tableCoordinatesToGo);
        console.log(dimsToGo);
        const padd = rangeValue / 50.0
        detsToExtr(imgsToGo, dimsToGo, tableCoordinatesToGo, padd);
    }


    const getNewBounds = (rows, cols) => {
        return rows,cols;
    }
    if (idx == -1) return null;
    if (images.filter((e, i) => !deletedIdxs.includes(i)).length > 0) return(
        <>
        <Button onClick={decrementPage}> {"<"} </Button> Page {idx + 1} of {images.filter((e, i) => !deletedIdxs.includes(i)).length} <Button onClick={incrementPage}> {">"} </Button>   <Button onClick={deletePage} monochrome outline> DELETE PAGE </Button>
        <ImageEdit image={currentImage} idx={idx} imgDims={imgDims[idx]} handleNewBoundsChange={handleNewBoundsChange} imgTableCoordinates={tableCoordinates[idx]} />
        {/* <RangeSlider
            output
            label="Some padding may be used for the text detection, which is based on a percentage. If the table is condensed and other columns are being read, reduce the padding with the slider below. If not enough text is being read, increase the slider."
            min={0}
            max={100}
            value={rangeValue}
            onChange={handleRangeSliderChange}
        /> */}
        <Button onClick={submitNewTable}>Submit for Extraction</Button>
        </>
    )
    return null

}