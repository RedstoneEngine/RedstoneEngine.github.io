

async function loadNodeGraph(div, fileURL)
{
    //Fetch file from url
    const nodeGraph = await fetch(fileURL);

    //Uh oh
    if (!nodeGraph.ok) {
        const message = await graphResponse.text();
        throw new Error(message || `Request failed (${nodeGraph.status})`);
    }

    //Ask Voronoi to convert JSON
    const graphResponse = await fetch('https://voronoi.ch/graph.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: nodeGraph.json(),
    });

    //Uh oh
    if (!graphResponse.ok) {
        const message = await graphResponse.text();
        throw new Error(message || `Request failed (${graphResponse.status})`);
    }

    //Display Results
    const result = await graphResponse.json();
    div.setData(result);
}

loadNodeGraph(document.getElementById('graph'), "./NodeFiles/SkewedMountain.json");