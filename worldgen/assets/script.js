
var directory = "Home/";

var directoryHistory = [];
var scrollHistory = [];

var guideIframe = document.getElementById("Guide");

function clickSelection(e) {
    if (e.currentTarget.hasAttribute("key")) {
        var folder = e.currentTarget.getAttribute("key");

        //Hide Previous
        hidePreviousDirectory();

        //Go Back
        if (folder == "back") {
            var splitDirectory = directory.split("/");
            folder = splitDirectory.at(-3);
            splitDirectory.pop();
            splitDirectory.pop();
            directory = splitDirectory.join("/") + "/";
        }
        else
            directory += folder + "/";

        //Go To Next
        document.getElementById(folder).style.display = "";
        document.getElementById("Title").innerText = folder == "Home" ? "Hytale WorldGenV2 Guides" : e.currentTarget.innerText;

        //Hash for Later
        document.location.hash = directory.substring(5);
    }
    else if (e.currentTarget.hasAttribute("file")) {
        var file = e.currentTarget.getAttribute("file");
        
        //Hide Previous
        hidePreviousDirectory();

        //Open Up Page
        directory += file;
        if (guideIframe.src.endsWith(directory.replace("Home", ""))) {
            guideIframe.style.display = "";
        }
        else {
            guideIframe.src = "";
            setTimeout(() => { 
                guideIframe.src = directory.replace("Home", ".").toLowerCase();
                guideIframe.style.display = "";
                guideIframe.contentWindow.scrollTo(0, 0); 
            }, 100);
        }
        document.getElementById("Title").style.display = "none";

        //Hash for Later
        document.location.hash = directory.substring(5);
        document.getElementById("backBttn").style.display = "";
    }
}

document.querySelectorAll("folder").forEach((folder) => {
    folder.addEventListener("click", clickSelection);
});

document.querySelectorAll("file").forEach((file) => {
    file.addEventListener("click", clickSelection);
});

function goBack() {
    //Has History
    if (directoryHistory.length > 0) {
        directory = directoryHistory.pop();
        guideIframe.src = directory.replace("Home", ".").toLowerCase();
        document.location.hash = directory.substring(5);
        var scroll = scrollHistory.pop();

        guideIframe.onload = function() {
            guideIframe.contentWindow.scrollTo(0, scroll); 
        };

        return;
    }

    //Go through folders
    hidePreviousDirectory();

    var splitDirectory = directory.split("/");
    folder = splitDirectory.at(-2);
    splitDirectory.pop();
    directory = splitDirectory.join("/") + "/";

    document.getElementById(folder).style.display = "";
    document.location.hash = directory.substring(5);

    setTitleTo(directory);
    document.getElementById("Title").style.display = "";

    document.getElementById("backBttn").style.display = "none";
}

function goToPage(newDirectory) {
    if (newDirectory == '')
        return;

    directoryHistory.push(directory);
    scrollHistory.push(guideIframe.contentWindow.scrollY);

    directory = newDirectory;
    guideIframe.src = directory.replace("Home", ".").toLowerCase();
    document.location.hash = directory.substring(5);
}

function hidePreviousDirectory() {
    var previousDirect = "Guide";
    if (directory.endsWith("/"))
        previousDirect = directory.split("/").at(-2);
    document.getElementById(previousDirect).style.display = "none";
}

function loadCurrent() {
    directory = "Home/" + document.location.hash.substring(1);
    if (directory == "Home/")
        return;

    //Check if is valid directory
    var savedDirectory = document.getElementById(directory.split("/").at(-2));
    if (!savedDirectory) {
        document.location.hash = "";
        directory = "Home/";
        return;
    }

    //Folder
    if (directory.endsWith("/")) {
        document.getElementById("Home").style.display = "none";
        savedDirectory.style.display = "";
        setTitleTo(directory);
    }
    //File
    else {
        document.getElementById("Home").style.display = "none";
        guideIframe.src = directory.replace("Home", ".").toLowerCase();
        guideIframe.style.display = "";
        document.getElementById("backBttn").style.display = "";
        document.getElementById("Title").style.display = "none";
    }
}

function setTitleTo(directory) {
    var previousDirect = document.getElementById(directory.split("/").at(-3));
    var currentDirect = directory.split("/").at(-2);

    for (var i = 0; i < previousDirect.children.length; i++) {
        if (previousDirect.children[i].getAttribute("key") == currentDirect || previousDirect.children[i].getAttribute("file") == currentDirect) {
            document.getElementById("Title").innerText = previousDirect.children[i].innerText;
        }
    }
}

loadCurrent();