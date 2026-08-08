
// Change icon and title
document.title = "Gavin Hughes"

var icons = document.getElementsByClassName('icon');
for (var i = 0; i < icons.length; i++) {
    icons[i].href = icons[i].href.slice(0, -4) + "_Hughes.ico";
}
