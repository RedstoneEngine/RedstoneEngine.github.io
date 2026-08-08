//Load Projects

var tableIds = ["Programming", "Engineering"];

function loadProjectsTable(index, filter) {
    //Load Table if not init
    if (projectsTable[index] == null) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 200) {
                var response = xhr.responseText;
                projectsTable[index] = response.split("\r\n");
                if (projectsTable[index].length < 2)
                    projectsTable[index] = response.split("\n");

                //Load FullReleases if hash is set
                if (!filter && index == 0)
                    filter = "";

                loadProjects(index, filter);
            } else {
                console.error("Request failed. Status:", xhr.status);
            }
        };

        xhr.onerror = function() {
            console.error("Network Error");
        };

        //Load
        xhr.open("GET", "./assets/details/Projects-" + tableIds[index] + ".csv", true);
        xhr.send();
    }
}

var projectsTable = [];
var hoverTimeout = null;
var unhoverTimeout = null;
var hoverDiv = null;

function loadProjects(index, filter) {
    var id = tableIds[index];
    var page = document.getElementById(id + "_");

    //Apply filter to url hash
    document.location.hash = document.location.hash.split('_')[0];
    if (filter && filter != "")
        document.location.hash += "_" + filter.replaceAll(" ", "");

    if (index == 1) {
        loadOldProjectFormat(index, filter, id, page);
        return;
    }

    page = page.children[3];

    //Remove Old
    for (var i = 1; i < page.children.length; i++) {
        page.children[i].remove();
        i--;
    }

    //Add New
    projectsTable[index].forEach((element) => {
        var row = element.split(",");

        //New Node
        if (row[0] != "" && row[0] != "Title" && !row[0].startsWith('-')) {
            //Is not in Filter
            if (filter && filter != "" && filter != "All" && !row[3].includes(filter)) {
                return;
            }
            var newNode = page.children[0].cloneNode(true);
            newNode.style.display = "";
            page.appendChild(newNode);

            //Date
            newNode.children[0].children[0].innerText = row[2];

            //Title/Descriptor
            newNode.children[1].children[0].children[1].innerText = row[0];
            newNode.children[1].children[0].children[2].innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;" + row[1];
            
            //Tags
            var tags = row[3].split(" / ");
            tags.forEach((tag) => {
                var newTag = newNode.children[1].children[0].children[4].children[0].cloneNode(true);
                newTag.style.display = "";
                newNode.children[1].children[0].children[4].appendChild(newTag);
                newTag.innerText = tag;
            });

            //Description
            var desc = row[5];
            if (desc.startsWith("\"")) {
                desc = desc.slice(1) + ",";
                for (var i = 6; i < row.length; i++)
                    desc += row[i] + ",";
                desc = desc.slice(0, -2).replaceAll('""', '"');
            }
            newNode.children[1].children[0].children[3].children[0].innerText = desc;

            //Thnl / GIF
            newNode.children[1].children[0].children[0].children[0].src = "./assets/sprites/programming/" + row[0].replaceAll(" ", "").replaceAll(".", "") +".webp";
            newNode.children[1].children[1].poster = "./assets/sprites/programming/" + row[0].replaceAll(" ", "").replaceAll(".", "") +"_Poster.webp";
            newNode.children[1].children[1].children[0].src = "./assets/sprites/programming/" + row[0].replaceAll(" ", "").replaceAll(".", "") +".mp4";

            //Setup Hover response
            newNode.addEventListener("mouseenter", (e) => {
                if (hoverDiv == e.target)
                    clearTimeout(unhoverTimeout);
                else
                    hoverTimeout = setTimeout(() => {e.target.children[1].children[1].play(); hoverDiv = e.target; console.log("Play")}, 500);
            });
            newNode.addEventListener("mouseleave", (e) => {
                clearTimeout(hoverTimeout);
                if (hoverDiv != e.target)
                    return;
                unhoverTimeout = setTimeout(() => {e.target.children[1].children[1].pause(); hoverDiv = null; console.log("Stop")}, 1000);
            });
        }
    });
}

//Redisplays list with set filter

function projectFilter(self) {
    var parent = self.parentElement;
    var filter = self.innerText;
    // Buttons
    for (var i = 0; i < parent.children.length; i++)
        parent.children[i].classList.remove("selected");
    self.classList.add("selected");

    loadProjects(0, filter);
}

function displayProject(self) {
    document.getElementById("projectsOverlay").children[1].src = "";
    setTimeout(() => {
        var src = "./projects/" + self.children[1].children[0].children[1].innerText.replaceAll(" ", "").replaceAll(".", "") + ".html";
        document.getElementById("projectsOverlay").children[1].src = src;
        showOverlay("projectsOverlay");
        document.body.style.overflowY = "hidden";
    }, 100);
}

function displayProjectURL(src) {
    document.getElementById("projectsOverlay").children[1].src = src;
    showOverlay("projectsOverlay");
    document.body.style.overflowY = "hidden";
}

/* Posts */

function loadPosts() {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = xhr.responseText;
            console.log(response);
        } else {
            console.error("Request failed. Status:", xhr.status);
        }
    };

    xhr.onerror = function() {
        console.error("Network Error");
    };

    //Load
    xhr.open("GET", "https://www.youtube.com/playlist?list=PLszFVnnZcmapP2qXNge1asFiabbzZ5rrs", true);
    xhr.send();
}


/* Deprecated */

function loadOldProjectFormat(index, filter, id, page) {
    //Remove Old
    for (var i = 4; i < page.children.length - 1; i++) {
        page.children[i].remove();
        i--;
    }

    //Add New
    var currNode = null;
    var lastNode = page.children[4];
    var description = "";

    projectsTable[index].forEach((element) => {
        var row = element.split(",");

        //New Node
        if (row[0] != "" && row[0] != "Title") {
            //Apply last description
            if (currNode != null) {
                currNode.children[0].children[2].innerHTML = description.slice(0, -8);
                description = "";
            }

            //Is not in Filter
            if (filter && filter != "" && filter != "All" && !row[2].includes(filter)) {
                currNode = null;
            }
            //Is in Filter
            else {
                currNode = page.children[3].cloneNode(true);
                lastNode.before(currNode);
                currNode.style.display = "";

                //Date
                currNode.children[0].children[0].children[1].innerText = row[1];

                // Has Link
                if (row[3] != "") {
                    currNode.children[0].children[0].children[0].href = row[3];
                    //Title
                    currNode.children[0].children[0].children[0].firstChild.data = row[0] + " ";
                }
                // No Link
                else {
                    currNode.children[0].children[0].children[0].remove();
                    //Title
                    currNode.children[0].children[0].firstChild.data = row[0];
                }

                //Images
                var shortName = row[0].replaceAll(" ", "").replaceAll(".", "").replaceAll(":", "").replaceAll("-", "");
                currNode.children[0].children[1].children[0].src = "./assets/sprites/" + id.toLowerCase() + "/" + shortName + "_Main.webp";

                for (var i = 0; i < 3; i++)
                    currNode.children[1].children[i].style.backgroundImage = "url('./assets/sprites/" + id.toLowerCase() + "/" + shortName + "_" + (i + 1) + ".webp')"

                //Has Video
                if (row[4] != "") {
                    currNode.children[1].children[2].setAttribute("youtube", row[4]);
                    currNode.children[1].children[2].style.borderColor = "white";
                }
                //Remove play button
                else {
                    currNode.children[1].children[2].children[0].remove();
                }
            }
        }

        //Add Description rows
        if (currNode) {
            var desc = "&nbsp;&nbsp;&nbsp;&nbsp;";
            for (var i = 5; i < row.length - 1; i++)
                desc += row[i].replaceAll("\"", "") + ",";
            desc = desc.slice(0, -1);
            desc += "<br><br>";
            //Add Links in Text
            var linkInfo = row[row.length - 1];
            if (linkInfo != "") {
                var links = linkInfo.split(" / ");
                links.forEach((link) => {
                    var linkKeyValue = link.split("=");
                    desc = desc.replace(linkKeyValue[0], "<a href='" + linkKeyValue[1] + "' target='_blank'>" + linkKeyValue[0] + "</a>");
                });
            }
            description += desc;
        }
    });
    if (currNode) {
        currNode.children[0].children[2].innerHTML = description.slice(0, -8);
        currNode.classList.add("lastArticle");
    }
}