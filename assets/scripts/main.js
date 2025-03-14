
// Main JS Functions

// Assign Element Variables
document.addEventListener("DOMContentLoaded", () => {
    banner = document.getElementById("banner");
    navBar = document.getElementById("navBar");
    shortNavBar = document.getElementById("shortNavBar");
    navBarSpacer = document.getElementById("navBarSpacer");

    // Load current Page
    var hashLocation = document.location.hash;
    if (hashLocation != null) {
        // Portfolio Page Load
        var isPorfolio = false;
        if (hashLocation.endsWith("Portfolio")) {
            isPorfolio = true;
            hashLocation = hashLocation.substring(0, hashLocation.length - 9);
            document.getElementById("navBar").classList.add("hide");
            document.getElementById("shortNavBar").classList.add("hide");
            document.getElementById("navBarSpacer").classList.add("hide");

            var pages = document.getElementsByClassName('page');
            for (var i = 0; i < pages.length; i++) {
                pages[i].classList.add("pageFullHeight");
            }
        }
        // Standard Page Load
        if (document.getElementById(hashLocation.substring(1) + "_") != null) {
            if (!isPorfolio)
                document.getElementById("WhoAmI?_").classList.remove("showPage")
            document.getElementById(hashLocation.substring(1) + "_").classList.add("showPage");
            document.getElementById("navBarCurrent").firstChild.textContent = hashLocation.substring(1);
            for (var i = 0; i < document.getElementById("navBar").children.length; i++) {
                var child = document.getElementById("navBar").children[i];
                if (i == 0)
                    child.classList.remove("selected");
                if (child.children[0].innerHTML.startsWith(hashLocation.substring(1, 4))) {
                    child.classList.add("selected");
                }
            }
        }
        else {
            document.location.hash = '';
        }
    }
});

// Overlay functions
function showOverlay(showId) {
    if (!document.getElementById("overlay").classList.contains("showOverlay")) {
        document.getElementById("overlay").classList.add("showOverlay");
        document.getElementById("overlay").onclick = function(e) {showOverlay(showId)};
        document.getElementById(showId).classList.add("show");
        document.getElementById(showId).parentElement.style.zIndex = 11;
    }
    else {
        document.getElementById("overlay").classList.remove("showOverlay");
        document.getElementById(showId).classList.remove("show");
        document.getElementById(showId).parentElement.style.zIndex = null;
    }
}

// Nav Button Sticky Header
var banner = null;
var navBar = null;
var shortNavBar = null;
var navBarSpacer = null;
window.addEventListener("scroll", () => {
    if (window.scrollY >= banner.clientHeight + 20) {
        navBar.classList.add("navBarLock");
        shortNavBar.classList.add("navBarLock");
        navBarSpacer.style.display = "inherit";
    }
    else {
        navBar.classList.remove("navBarLock");
        shortNavBar.classList.remove("navBarLock");
        navBarSpacer.style.display = "none";
    }
});

// Nav Button Selection
function showPage(self) {

    if (window.scrollY >= banner.clientHeight)
        window.scrollTo(0, banner.clientHeight);

    var prevIndex = -1;
    var currIndex = -1;
    var prevPage = null;
    var currPage = null;

    // Find Last Selection
    for (var i = 0; i < document.getElementById("navBar").children.length; i++) {
        var child = document.getElementById("navBar").children[i];
        if (child.children[0] == self)
            // Track Current index
            currIndex = i;
        else if (child.classList.contains("selected")) {
            // Remove Button Selection
            child.classList.remove("selected");
            // Hide Previous Page
            prevPage = document.getElementById(child.children[0].innerHTML.replaceAll(' ', '') + "_");
            setTimeout(() => {prevPage.classList.remove("showPage")}, 250);
            // Grab index
            prevIndex = i;
        }
    }

    // Enable Button Selection
    self.parentNode.classList.add("selected");
    // Show Corresponding Page
    var pageName = self.innerHTML.replaceAll(' ', '');
    currPage = document.getElementById(pageName + "_");
    document.location.hash = pageName;
    currPage.classList.add("showPage");

    document.getElementById("navBarCurrent").firstChild.textContent = self.innerHTML;

    // Animations
    if (prevIndex != -1) {
        if (currIndex > prevIndex) {
            prevPage.style.animation = "slideInFromLeft .25s ease-in-out 0s 1 reverse forwards";
            currPage.style.animation = "slideInFromRight .25s ease-in-out 0s 1 normal forwards";
        }
        else {
            prevPage.style.animation = "slideInFromRight .25s ease-in-out 0s 1 reverse forwards";
            currPage.style.animation = "slideInFromLeft .25s ease-in-out 0s 1 normal forwards";
        }
        // Reset
        setTimeout(() => {prevPage.style.animation = ""}, 250);
        setTimeout(() => {currPage.style.animation = ""}, 250);
    }
}

// Dropdown Page Selection
function dropdownShowPage(index) {
    console.log(index);
    document.getElementById("navBar").children[index].children[0].click();
    showOverlay("navList");
}