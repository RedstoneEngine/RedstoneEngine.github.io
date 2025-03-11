
// Assign Element Variables
document.addEventListener("DOMContentLoaded", () => {
    banner = document.getElementById("banner");
    navBar = document.getElementById("navBar");
    shortNavBar = document.getElementById("shortNavBar");
    navBarSpacer = document.getElementById("navBarSpacer");
});

// Overlay functions
function showOverlay(show, overlayId, event) {
    if (show) {
        document.getElementById(overlayId).classList.add("showOverlay");
        document.getElementById(overlayId).onclick = function(e) {showOverlay(false, overlayId, e)};
    }
    else if (!event || event.target.classList.contains("overlay"))
        document.getElementById(overlayId).classList.remove("showOverlay");
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

    var prevIndex = -1;
    var currIndex = -1;
    var prevPage = null;
    var currPage = null;

    // Find Last Selection
    for (var i = 0; i < document.getElementById("navBar").children.length; i++) {
        var child = document.getElementById("navBar").children[i];
        if (child.classList.contains("selected")) {
            // Remove Button Selection
            child.classList.remove("selected");
            // Hide Previous Page
            prevPage = document.getElementById(child.children[0].innerHTML);
            setTimeout(() => {prevPage.classList.remove("showPage")}, 250);
            // Grab index
            prevIndex = i;
        }
        if (child.children[0] == self)
            // Track Current index
            currIndex = i;
    }

    // Enable Button Selection
    self.parentNode.classList.add("selected");
    // Show Corresponding Page
    currPage = document.getElementById(self.innerHTML);
    currPage.classList.add("showPage");

    // Animations
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