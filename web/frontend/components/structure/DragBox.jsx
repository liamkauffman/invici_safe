import Draggable, {DraggableCore} from "react-draggable";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";

export default function DragBox(props) {

    const handleLog = (e) => {
        console.log(e.layerX);
        console.log(e.layerY);
        console.log(props.coordinates)
    }
    const {x1, y1, x2, y2} = props.coordinates
    const { idx, handleNewBoundsChange } = props

    const handleTLChange = (e) => {

        handleNewBoundsChange(idx, {x1: e.layerX, y1: e.layerY, x2, y2 });
        // console.log(e.layerX);
        // console.log(e.layerY);
    }
    const handleBRChange = (e) => {
        handleNewBoundsChange(idx, {x1, y1, x2: e.layerX, y2: e.layerY });
        // console.log(e.layerX);
        // console.log(e.layerY);
    }

    return  <>
        <div style={{
            position: "absolute",
            top:y1,
            left: x1,
            width: x2-x1,
            height: y2-y1,
            border: "3px solid #ff0000"
        }} />
        <div style={{position: "absolute"}}>
        <Draggable position={{x: x1, y: y1}} positionOffset={{ x: '-50%', y: '-50%' }} onDrag={handleTLChange} onStop={handleLog}>
            <p>+</p>
        </Draggable>
        </div>
        <div style={{position: "absolute"}}>
        <Draggable position={{x: x2, y: y2}} positionOffset={{ x: '-50%', y: '-50%' }} onDrag={handleBRChange} onStop={handleLog}>
            <p>+</p>    
        </Draggable>
        </div>
    {/* <Box sx={{ top: y1, left: x1, right: x2, bottom: y2, border: '1px dashed grey' }}>
    </Box>    */}
    </>

    return null

}