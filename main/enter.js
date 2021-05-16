function makeGET(URL, callback) {
    fetch(URL)
     .then(response => response.text())
     .then(text => callback(text))
     .catch(err => {
            console.log(`${URL} not found.`)
            return true;
        })
}
function submit () {
    var name = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    if ( name.length > 0 && password.length > 0) {
        makeGET(`${window.location.href}/${name}/${password}`, (res) => {
            var sn = name
            for ( i = 0; i < name.length; i++ ) {
                sn = sn.replace("/", "")        
            }
            makeGET(`${window.location.href}/valid/name/${sn}`, (s) => {
                if ( s == "false") {
                    alert("Enter a valid username which doesn't contain: '/', '\\', '<' and '>'");
                } else {
                    if ( res == "err" ) {
                        alert("User or password incorrect");
                    } else {
                        window.localStorage.user = res;
                        window.location.href = window.location.href.substr(0, window.location.href.indexOf("/")) + "list"
                    }
                }
            })
        })
    } else {
        alert("You need to fill the inputs")
    }
}