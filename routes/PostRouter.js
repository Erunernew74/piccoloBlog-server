const Post = require("../models/PostModel");
const router = require("express").Router();
const mongoose = require("mongoose");
const fs = require("fs");
const imageUpload = require("../middleware/image-uploads");
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");

//* Richiesta deli user o autori tramite una fetch da inserire nella select
//* In pratica faccio una richiesta api alla tabella Post e seleziono solo gli user
//* che non sono altro coloro che scrivono il post
//* Faccio una find(9 sulla tabella Post e seleziono gli user facendoli visualizzare
//* in ordine decrescente
router.get("/autori", async (req, res) => {
  try {
    const autori = await Post.find().select("user").sort({ user: "asc" });
    res.status(200).json(autori);
  } catch (error) {
    console.log(error);
    res.status(400).json({});
  }
});

//* Rotta per l'inserimento di un post nel blog tramite un form
router.post(
  "/insertPost",
  //   auth,
  imageUpload.single("image"),
  async (req, res) => {
    try {
      const { title, subtitle, content, user, ext } = req.body;

      const newPost = await Post({
        title,
        subtitle,
        content,
        user,
        ext,
      });

      //* Validazione del post
      switch (true) {
        case !title:
          return res.status(400).json({ msg: "Il titolo è richiesto" });
          break;
        case !subtitle:
          return res.status(400).json({ msg: "Il sottotitolo è richiesto" });
          break;
        case !content:
          return res.status(400).json({ msg: "Il content è richiesto" });
          break;
        case !user:
          return res.status(400).json({ msg: `L'user è richiesto` });
          break;
      }

      const { id } = await newPost.save();

      fs.rename(
        `./uploads/images/${req.body.tmpId}.${req.body.ext}`,
        `./uploads/images/${id}.${ext}`,
        function (err) {
          if (err) console.log("ERROR: " + err);
        }
      );

      res
        .status(200)
        .json({ msg: `L'inserimento del post è avvenuto con successo` });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ msg: `Errore nell'inserimento del post` });
    }
  }
);

//* VISUALIZZIAMO TUTTI I POST
router.get("/allPosts", async (req, res) => {
  const allPosts = await Post.find({}).sort({ createdAt: "desc" });
  res.json(allPosts);
});

//* VISUALIZZAZIONE DI UN SINGOLO POST
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const singlePost = await Post.findById(id);
    res.status(200).json(singlePost);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: `Errore nella visualizzazione del post` });
  }
});

//* Rotta per la ricerca di un post dalla search Bar
router.post("/search", async (req, res) => {
  const { titolo, autore, sottoTitolo, startDate, endDate } = req.body;
  console.log(req.body);
  try {
    console.log(startDate, endDate);
    let options = {
      title: new RegExp(titolo, "i"),
      subtitle: new RegExp(sottoTitolo, "i"),
      user: new RegExp(autore, "i"),
    };

    if (startDate && endDate) {
      options.createdAt = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate)),
      };
    } else {
      if (startDate)
        options.createdAt = {
          $gte: startOfDay(new Date(startDate)),
        };

      if (endDate)
        options.createdAt = {
          $lte: endOfDay(new Date(endDate)),
        };
    }

    const result = await Post.find(options);

    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({});
  }
});

//* Rotta per vedere un singolo post con lo useEffect
router.get('/post/:id', (async (req, res) => {
  try {
    const { id } = req.params;
    const singlePost = await Post.findById(id)
    res.status(200).json(singlePost)
  } catch (error) {
    console.log(error)
    res.status(400).json({msg:`Errore nella visualizzazione del post`})
  }
}))


//* Rotta per l'update di un post
router.put("/update/:id",imageUpload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, content, oldImage } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ msg: `Utente non trovato` });
    const singlePostUpdated = await Post.findByIdAndUpdate(
      { _id: id },
      { title, subtitle, content },
      { new: true }
    );

    //* Codice Per togliere la vecchia immagine ed inserire quella nuova
    if(req.body.tmpId) {
      await Post.updateOne(
        {_id: id},
        {ext: req.body.ext}
      )
       //* Eliminiamo la vecchia immagine
       fs.unlinkSync(`./uploads/images/${oldImage}`)
       //* Carichiamo la nuova immagine  
       fs.rename(
         `./uploads/images/${req.body.tmpId}.${req.body.ext}`,
         `./uploads/images/${id}.${req.body.ext}`,
         function (err) {
           if (err) console.log("ERROR: " + err);
         }
       );
    }

    res.status(200).json({msg: `Update avvenuto correttamente`, singlePostUpdated})

  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: `Errore nell'update del post` });
  }
});

module.exports = router;
