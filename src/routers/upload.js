const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const auth = require('../middleware/auth')
const logger = require('../logger/logger')

const router = new express.Router() 

// Mongo URI
const mongoURI = process.env.DB_PATH;

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage, 
  fileFilter(req, file, cb){
    if(!file.mimetype.startsWith('video') && !file.mimetype.startsWith('image') && !file.mimetype.startsWith('audio'))
      return cb(new Error("File is not image/video/audio"))
    
    cb(undefined, true)
  }
});






// @route POST /upload
// @desc  Uploads file to DB
router.post('/upload',auth , upload.single('file'), async (req, res) => {
    try{
    //console.log(String(req.file.filename))
    res.send({ file : req.file });
    logger.info(`method=POST path=/upload status=200 - File upload for ${req.user.email}`)
    // res.redirect('/');
    }catch(error){
        res.status(500).send({error:error.message}) 
        logger.error(`method=POST path=/upload status=500 - ${error.message} for ${req.user.email}`)
    }
}, (error, req, res, next) => {
  res.status(400).send({error: error.message})
  logger.error(`method=POST path=/upload status=400 - ${error.message} for ${req.user.email}`)
});






// @route POST /uploadprofilepic
// @desc  Uploads file to DB
router.post('/uploadprofilepic', upload.single('file'), async (req, res) => {
  try{
  //console.log(String(req.file.filename))
  res.send({ file : req.file });
  logger.info(`method=POST path=/uploadprofilepic status=200 - Profile pic upload`)
  // res.redirect('/');
  }catch(error){
      res.status(500).send({error}) 
      logger.error(`method=POST path=/uploadprofilepic status=500 - ${error.message} `)
  }
}, (error, req, res, next) => {
res.status(400).send({error: error.message})
logger.error(`method=POST path=/uploadprofilepic status=400 - ${error.message}`)
});





// @route GET /files/me
// @desc  Display all files in JSON
router.get('/files/me',auth , (req, res) => {

    try{
    userFilenames = req.user.filenames
    gfs.files.find({"filename":{$in: userFilenames }}).toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
    return res.status(404).json({
        err: 'No files exist'
    });
    }
    //console.log(files)
    // Files exist
    logger.info(`method=GET path=/files/me status=200 - Files for ${req.user.email}`)
    return res.send(files);
    
    });
    }catch(error){
        res.status(500).send({error:error.message})
        logger.error(`method=GET path=/files/me status=500 - ${error.message} for ${req.user.email}`)
    }
});






// @route GET /filesdata/:filename
// @desc  Display single file object
router.get('/filesdata/:filename',auth , (req, res) => {
    try{
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
      // File exists
      logger.info(`method=GET path=/filesdata/${req.params.filename} status=200 - get file info for ${req.user.email}`)
      return res.json(file);
    });
    }catch(error){
        res.status(500).send({error})
        logger.error(`method=GET path=/filesdata/${req.params.filename} status=500 - ${error.message} for ${req.user.email}`)
    }
  });






// @route GET /files/:filename
// @desc Display Image
router.get('/files/:filename', (req, res) => {
    try{
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
    logger.error(`method=GET path=/files/${req.params.filename} status=404 - File not found `)
    return res.status(404).json({
        err: 'No file exists'
    });
    }
    // Read output to browser
    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res); 
    logger.info(`method=GET path=/files/${req.params.filename} status=200 - Display file `)
    });
    }catch(error){
        res.status(500).send({error})
        logger.error(`method=GET path=/files/${req.params.filename} status=500 - ${error.message}`)
    }
});







// @route DELETE /files/:id
// @desc  Delete file
router.delete('/files/:filename', async(req, res) => {
    try{
    const file = await gfs.files.findOne({filename: req.params.filename})  
    await gfs.remove({ filename: req.params.filename, root: 'uploads'}, (err, gridStore) => {
    if (err) {
        res.status(404).send({ err });
    }
    });
    res.send({filename: file.originalname})
    logger.info(`method=DELETE path=/files/${req.params.filename} status=200 - delete file`)
    }catch(error)
    {
        res.status(500).send({error})
        logger.error(`method=DELETE path=/files/${req.params.filename} status=500 - ${error.message} `)
    }
});


module.exports = router