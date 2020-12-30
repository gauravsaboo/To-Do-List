const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const _ = require("lodash")
const date = require(__dirname + "/date.js")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static("public"));


// Displaying Date on ToDoList from date.js file

let day = date.getDate();


// Initilizing and Creating todolistDB

mongoose.connect("mongodb://localhost:27017/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

// ToDoList Item Schema

const itemsSchema = new mongoose.Schema({
    name: String
});


// Creating Item model with itemsSchema

const Item = mongoose.model("Item", itemsSchema);


// Default Items Added to List

const item1 = new Item({
    name: "Welcome to Your To Do List."
});

const item2 = new Item({
    name: "Hit (+) to Add New Item."
});

const item3 = new Item({
    name: "<-- Hit this to Delete Item."
});


// Default Item Array

const defaultItems = [item1, item2, item3];


// Creating listSchema for Variable ToDoLists

const listSchema = {
    name: String,
    items: [itemsSchema]
};

// Creating List Model from ListSchema

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

    // Checking the number of Elements in the List and if its empty then add default elements.

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Default Item Inserted");
                }
            })
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: day,
                newListItems: foundItems
            })
        }
    })
});

app.post("/", function (req, res) {

    // Inserting new Items in List provided by User
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    })

    if (listName === day) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
})

app.post("/delete", function (req, res) {

    const checkedItemId = req.body.itemRemove;
    const listName = req.body.listName;

    if (listName === day) {
        Item.findByIdAndDelete(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully Deleted");
                res.redirect("/");
            }
        })
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
          if (!err) {
            res.redirect("/" + listName);
          } 
        });
     }
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create New List
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                })
            }
        }
    })
})


app.listen("3000", function () {
    console.log("Port 3000 has been initilized");
})