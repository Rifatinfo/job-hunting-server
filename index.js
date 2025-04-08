require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

const app = express()  
app.use(cors());
app.use(express.json())  


// const uri = "mongodb+srv://<db_username>:<db_password>@cluster0.i1uhr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri =`mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.i1uhr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("soloSphere")
    const jobCollection = db.collection("jobs");
    const bidCollection = db.collection("bids");

    app.post('/add-job', async (req, res) =>{
      const jobData = req.body;
      console.log((jobData));
      const result = await jobCollection.insertOne(jobData)
      res.send(result);
    })

    app.post('/add-bid', async (req, res) => {
      const bidData = req.body;
      console.log(bidData);
      
      const query = {email : bidData.email, jobId : bidData.jobId}
      const alreadyExist = await bidCollection.findOne(query);
      if(alreadyExist) return res.status(404).send('you already bid Now');
      const result = await bidCollection.insertOne(bidData);
      const filter = {_id : new ObjectId(bidData.jobId)}
      const update =  {
        $inc : {
          bid_count : 1
        }
      } 
      const bidCountUpdate = await bidCollection.updateOne(filter, update);
      res.send(result, bidCollection);
    })

    app.get('/jobs', async (req, res) =>{
      const result = await jobCollection.find().toArray();
      res.send(result)
    })

    app.get('/bids/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email}
      const result = await bidCollection.find(query).toArray()
      res.send(result);
    })
    app.get('/bids-request/:email', async (req, res) => {
      const email = req.params.email;
      const query = {buyer : email}
      const result = await bidCollection.find(query).toArray()
      res.send(result);
    })

    app.get('/jobs/:email' , async (req, res) =>{
      const email = req.params.email;
      const query = {'buyer.email' : email};
      const result = await jobCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/job/:id', async (req,res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await jobCollection.deleteOne(query)
      res.send(result)
    })
    app.put('/update-job/:id', async (req, res) =>{
      const id = req.params.id
      const jobData = req.body;
      const query = {_id : new ObjectId(id)}
      const options = {upsert : true}
      const updated = {
        $set : jobData
      }
      const result = await jobCollection.updateOne(query, updated, options)
      res.send(result)
    })
    app.get('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Job Hunting !')
})

app.listen(port, () => {
  console.log(`Job Hunting! on port ${port}`)
})