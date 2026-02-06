//Loads Custom Elements in excel sheets for example

//Load Hobbies and Special Interests

function loadAboutMe()
{
    //Load Table if not init
    if (interestTable == null) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 200) {
                var response = xhr.responseText;
                interestTable = response.split("\r\n");
                loadInterest("My Friends");
            } else {
                console.error("Request failed. Status:", xhr.status);
            }
        };

        xhr.onerror = function() {
            console.error("Network Error");
        };

        //Load
        xhr.open("GET", "./assets/details/AboutMe-Hobbies.csv", true);
        xhr.send();
    }
}

var interestTable = null;

function loadInterest(interestIndex) {
    //Puts response based on table
    var inCorrectSection = false;
    var sectionString = "";
    interestTable.forEach((element) => {
        var keyItem = element.split(",");
        if (inCorrectSection && keyItem[0] != "")
            inCorrectSection = false;
        if (keyItem[0] == interestIndex || inCorrectSection) {
            inCorrectSection = true;
            sectionString += "&nbsp;&nbsp;&nbsp;&nbsp;";
            for (var i = 1; i < keyItem.length; i++)
                sectionString += keyItem[i].replaceAll("\"", "") + ",";
            sectionString = sectionString.slice(0, -1);
            sectionString += "<br><br>";
        }
    });
    sectionString = sectionString.slice(0, -8);
    document.getElementById("myInterests").children[1].innerHTML = sectionString;

    //Images
    document.getElementById("myInterests").children[0].children[0].src = "./assets/sprites/aboutMe/" + interestIndex + ".webp"
    document.getElementById("myInterests").children[2].children[0].src = "./assets/sprites/aboutMe/" + interestIndex + ".webp"
}

function selectNewInterest(self) {
    var parent = self.parentElement.parentElement;
    // Buttons
    for (var i = 0; i < parent.children.length; i++) {
        parent.children[i].classList.remove("selected");
        if (parent.children[i].children[0] == self)
            interestIndex = self.innerText;
    }
    self.parentElement.classList.add("selected");

    loadInterest(interestIndex);
}


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

function loadProjects(index, filter) {
    var id = tableIds[index];
    var page = document.getElementById(id + "_");

    //Apply filter to url hash
    document.location.hash = document.location.hash.split('_')[0];
    if (filter && filter != "")
        document.location.hash += "_" + filter.replaceAll(" ", "");

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
            if (filter && filter != "" && !row[2].includes(filter)) {
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
                if (row[4] != "")
                    currNode.children[1].children[2].setAttribute("youtube", row[4]);
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

//Redisplays list with set filter

function projectFilter(self) {
    var parent = self.parentElement.parentElement;
    var filter = "";
    // Buttons
    for (var i = 0; i < parent.children.length; i++) {
        parent.children[i].classList.remove("selected");
        if (parent.children[i].children[0] == self)
            filter = self.innerText;
    }
    self.parentElement.classList.add("selected");

    filter = filter.replaceAll(" / ", "");

    if (filter == "All")
        filter = "";

    loadProjects(0, filter);
}