import { baseUrl } from "./baseUrl";



export const syncApi = () => {
    const syncStoreProds = async(fetch, shopId, setStatus) => {
        console.log('STARTING SYNC API')
        const lsRes = await fetch(baseUrl + '/last_sync');
        const lsResJson = await lsRes.json()
        const { last_sync } = lsResJson;
        setStatus("0% complete.")
        console.log(last_sync)
        console.log("bananas")
        const fetchResponse = await fetch(`/api/products/count?since=${last_sync}`);
        const data = await fetchResponse.json();
        const { count } = data;
        const prods = []
        // setStatus(`0/${count}`)
        let cursor = null;
        let moreToAdd = true
        let pkg = ""
        while(moreToAdd) {
            // await new Promise(r => setTimeout(r, 1000));
            if (cursor || last_sync != "never") {
                pkg = "?"
                if (last_sync != "never") {
                    pkg += `since=${last_sync}`
                }
                if (last_sync != "never" && cursor) pkg += "&";
                if (cursor) {
                    pkg += `cursor=${cursor}`
                }
            }
            let fetchResponse = null
            let r = null
            try {
                fetchResponse = await fetch('/api/products/gqlAll' + pkg);
                r = await fetchResponse.json();
            } catch (error) {
                continue
            }
            console.log(fetchResponse)
            console.log(r)
            if (r == null || fetchResponse == null|| fetchResponse.status != 200) continue;
            r.data.products.edges.forEach(prod => {
                prods.push(prod)
            });
            let percentage = Math.trunc(((prods.length / count) * 100))
            if (percentage > 100) percentage = 100;
            if (percentage < 0) percentage = 0; 
            setStatus(`${percentage}% complete.`)
            if (prods.length >= count) moreToAdd = false;
            if (prods.length > 0) cursor = prods.at(-1).cursor
        }
        console.log(prods)
        console.log(count);
        await fetch(baseUrl+'/shop_sync', {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({sync_cursors: prods}),
            method: 'POST'
        })
        setStatus("Sync Complete")

    }

    // check invici for last sync, 
    // if no last sync, then post loop to backend to find new producs
    // use loop to keep track of status of how many products are being synced

    // axios.post(`${baseUrl}/sync/last`, {})
    return { syncStoreProds }
}