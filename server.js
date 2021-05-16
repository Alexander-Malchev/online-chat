const express = require('express');
const app = express()
const fs = require('fs')

var data = require('./messages.json')
var md = require('./messageID.json')
var rm = require('./roomID.json')
var ui = require('./userID.json')
var user = require('./users.json')

class User {
    constructor ( name, password, id ) {
        this.name = name;
        this.password = password;
        this.id = id;
        this.rooms = []
    }
}

class Room {
    constructor(name, id, admin) {
        this.type = "Room";
        this.name = name;
        this.id = id;
        this.messages = [];
        this.admins = [admin];
    }
}

class Message {
    constructor(author, ai, admins, value, id) {
        this.type = "Message";
        this.author = author;
        this.ai = ai;
        this.value = value;
        this.id = id;
        this.date = new Date()
        this.delete = [this.ai].concat(admins);
    }
}

function random( from, to ) {
    return Math.floor ( Math.random () * (to - from) ) + from;
}

function genValidId(arr, from, to) {
    var res = random(from, to)
    while ( arr.indexOf(res) >= 0 ) {
        res = random(from, to)
    }
    return res;
}

function getRoom(id) {
    data.forEach( i => {
        if ( i.id === id ) {
            return i;
        }
    })
}

app.use(express.static('main'))
app.get( '/', (req, res) => res.redirect('/login') )
app.get( '/list', ( req, res ) => res.sendFile(__dirname + "/main/list.html"))
app.get( '/room/:id', (req, res) => res.sendFile(__dirname + "/main/main.html"))
app.get( '/login', ( req, res ) => res.sendFile( __dirname + '/main/login.html'))
app.get( '/invite/:id', ( req, res ) => res.sendFile( __dirname + '/main/invite.html'))
app.get( '/login/valid/name/:name', ( req, res ) => {
    const name = req.params.name;
    if ( name.indexOf("<") >= 0 || name.indexOf(">") >= 0 && name.indexOf("/") >= 0 && name.indexOf("\\") >= 0) {
        return res.send("false")
    }else {
        return res.send("true")
    }
})
app.get( '/invite/:id/n', function(req, res) {
    var r;
    data.forEach( i => {
        if ( i.id === Number( req.params.id ) ) {
            r = i;
            return res.send(r.name)
        }
    })
})
app.get( '/invite/:id/i/:userid', (req, res) => {
    for ( let i = 0; i < user.length; i ++ ) {
        if ( user[i].id === Number(req.params.userid)) {
            var r;
            data.forEach( i => {
                if ( i.id === Number( req.params.id ) ) {
                    r = i;
                }
            })
            user[i].rooms.forEach( i => {
                if ( i.id === Number( req.params.id )) {
                    return res.send(JSON.stringify(user[i]) + "")
                }
            })
            user[i].rooms.push( {name: r ? r.name : "", id: r ? r.id : 0 } )
            fs.writeFile('users.json', JSON.stringify(user), (err) => {
                if ( err ) throw err;
                console.log("User saved!")
            })
            return res.send(JSON.stringify(user[i]) + "")
        }
    }
})
app.get( '/login/:name/:password', (req, res) => {
    for ( let i of user ) {
        if ( i.name === req.params.name && i.password === req.params.password ) {
            return res.send(i)
        }
    }
    return res.send("err");
})
app.get('/register', (req, res) => res.sendFile(__dirname + '/main/register.html'))
app.get('/register/:name/:password', (req, res) => {
    const id = genValidId(ui, 100000, 999999)
    ui.push(id)
    user.push( new User(req.params.name, req.params.password, id))
    fs.writeFile('users.json', JSON.stringify(user), (err) => {
        if ( err ) throw err;
        console.log("User saved!")
    })
    fs.writeFile("userID.json", JSON.stringify(ui), (err) => {
        if ( err ) throw err;
        console.log("User ID saved!")
    })
    return res.send(user[user.length - 1])
})
app.get( '/room/:roomId/get', (req, res) => {
    data.forEach(i => {
        if ( i.id == Number(req.params.roomId) ) {
            return res.send(i)
        }
    });
})
app.get('/new/room/:name/:ai', (req, res) => {
    const id = genValidId(rm, 10000, 99999)
    const ai = Number(req.params.ai);
    rm.push(id)
    data.push(new Room(req.params.name, id, ai))
    fs.writeFile('messages.json', JSON.stringify(data), (err) => {
        if ( err ) throw err;
        console.log("Room saved!")
    })
    fs.writeFile('roomID.json', JSON.stringify(rm), (err) => {
        if ( err ) throw err;
        console.log("Room ID saved!")
    })
    res.send(JSON.stringify(data[data.length - 1]))
})
app.get('/room/:roomId/delete/message/:authorid/:msgid', (req, res) => {
    const ai = Number(req.params.authorid);
    const msgid = Number(req.params.msgid);
    const roomId = Number(req.params.roomId);
    console.log("Somebody is deleting a message", roomId, msgid, ai)
    for ( var i = 0; i < data.length; i ++ ) {
        if ( data[i].id == roomId ) {
            console.log("Room found")
            for ( var j = 0; j < data[i].messages.length; j ++ ) {
                if ( data[i].messages[j].id == msgid && data[i].messages[j].delete.indexOf(ai) >= 0 ) {
                    console.log("User authorised")
                    data[i].messages[j] = data[i].messages[data[i].messages.length - 1]
                    md[md.indexOf(msgid)] = md[md.length - 1]
                    md.pop()
                    data[i].messages.pop()
                    data[i].messages.sort((a, b) => a.date - b.date);
                    fs.writeFile('messages.json', JSON.stringify(data), (err) => {
                        if ( err ) throw err;
                        console.log("Message deleted!")
                    })
                    fs.writeFile('messagesID.json', JSON.stringify(md), (err) => {
                        if ( err ) throw err;
                        console.log("Message ID deleted!")
                    })
                }
            }
            return res.send(JSON.stringify(data[i]))
        }
    }
})
app.get('/room/:roomId/new/message/:author/:ai/:value', (req, res) => {
    const id = genValidId(md, 1000, 9999)
    md.push(id)
    for ( var i = 0; i < data.length; i ++ ) {
        if ( Number(req.params.roomId) == data[i].id ) {
            data[i].messages.push(new Message(req.params.author, Number(req.params.ai), data[i].admins, req.params.value, id))
            fs.writeFile('messages.json', JSON.stringify(data), (err) => {
                if ( err ) throw err;
                console.log("Messages saved!")
            })
            fs.writeFile('messagesID.json', JSON.stringify(md), (err) => {
                if ( err ) throw err;
                console.log("Message ID saved!")
            })
            return res.send(200)
        }
    }
})

app.listen(8080, () => console.log("Server running on 8080."))
