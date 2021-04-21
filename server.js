import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import multer from 'multer'
import GridFsStorage from 'multer-gridfs-storage'
import Grid from 'gridfs-stream'
import bodyParser from 'body-parser'
import pusher from 'pusher'
import path from 'path'

import mongoPosts from './postModel.js'

Grid.mongo =  mongoose.mongo

// app config 
const app = express()
const port= process.env.PORT||9000

//midleware
app.use(bodyParser.json())
app.use(cors())

//api config
const mongoURI = "mongodb+srv://FB-client:wSjlT9j9onhUfvwj@realmcluster.uqla7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

const conn = mongoose.createConnection(mongoURI,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
});

let gfs

conn.once('open',()=>{
    console.log("DB connected")

    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('images')
})

const storage = new GridFsStorage({
url: mongoURI,
file: (req, file)=>{
    return new Promise((resolve, reject)=>{
        const filename = `image-${Date.now()}${path.extname(file.originalname)}`
        const fileInfo ={
            filename:filename,
            bucketName:"images"
        }
        resolve(fileInfo)
    });
 }
});

const upload = multer({storage});

mongoose.connect(mongoURI,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
})
//api route
app.get('/',(req,res)=>res.status(200).send("hellow world"))

app.post('/upload/image',upload.single('file'),(req,res)=>res.status(200).send(req.file) )

app.post('/upload/post',(req,res)=>{
    const dbpost = req.body
    console.log(dbpost)
    mongoPosts.create(dbpost,(err, data)=>{
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

app.get('/retrieve/post',(req,res)=>{
    mongoPosts.find((err, data)=>{
        if(err){
            res.status(500).send(err)
        } else {
            data.sort((b,a )=>{
                return a.timestamp - b.timestamp;
            })
            res.status(201).send(data)
        }
    })
})

app.get('/retrieve/images/single',(req,res)=>{
    console.log(req.query.name)
    gfs.files.findOne({ filename : req.query.name},(err,file)=>{
        if(err){
            res.status(500).send(err)
        } else {
            console.log(file)

            if(!file || file.length === 0){
                res.status(404).send({err:"file not found error"})
            }
            else{
                const readstream = gfs.createReadStream(file.filename)
                readstream.pipe(res);
            }
        }
    })
})

//listern
app.listen(port,()=>console.log(`the server is started:  ${port}`))