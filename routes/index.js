const config = require("./hid/config")
const express = require("express");
const router = express.Router();
const jwt        = require("jsonwebtoken");
const Multer = require("multer");
const imgUpload = require("./UploadImage");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); // for working w/ our database
const UserSchema       = require("../models/user");
const User = mongoose.model("User", UserSchema);
const ProductSchema       = require("../models/product");
const Product = mongoose.model("Product", ProductSchema);
const CategorySchema       = require("../models/category");
const Category = mongoose.model("Category", CategorySchema);
const BrandSchema       = require("../models/brand");
const Brand = mongoose.model("Brand", BrandSchema);
const CarouselSchema       = require("../models/carousel");
const Carousel = mongoose.model("Carousel", CarouselSchema);

const PageSchema       = require("../models/page");
const Page = mongoose.model("Page", PageSchema);
const PageCategorySchema       = require("../models/pageCategory");
const PageCategory = mongoose.model("PageCategory", PageCategorySchema);
const BlogPageSchema       = require("../models/blogPage");
const BlogPage = mongoose.model("BlogPage", BlogPageSchema);
const fetch = require('node-fetch');

const superSecret = config.secret;
const multer = Multer({
  storage: Multer.MemoryStorage,
  fileSize: 5 * 1024 * 1024
});
router.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type, Authorization,Accept,x-access-token");
  // res.setHeader("Access-Control-Allow-Headers", "Origin,Access-Control-Allow-Headers, Origin,Accept,Authorization, x-access-token,X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");

  next();
});
// router.post("/user", function(req, res) {
//
//   let user = new User();
//
//   user.username = req.body.username;
//   user.password = req.body.password;
//
//   user.save((err)=>{
//     if(err){
//       res.send(err);
//     }
//     else
//     res.json({message:"success"})
//   })
// });
router.post("/authenticate", function(req, res) {
  if(req.body.username !== "admin"){
    res.json({
      success: false,
      message: "Usuario incorrecto"
    });
  }
  else
  // find the user
  User.findOne({
    username: req.body.username
  }).select("_id  username password ").exec(function(err, user) {
    if (err) throw err;

    // no user with that username was found
    if (!user) {
      res.json({
        success: false,
        message: "Usuario incorrecto"
      });
    } else {
      // check if password matches
      var validPassword = user.comparePassword(req.body.password);
      if (!validPassword) {
        res.json({
          success: false,
          message: "Contraseña incorrecta"
        });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign({
          _id: user.id,
          name: user.name,
          username: user.username,
        }, superSecret, {
          expiresIn: '24h' // expires in 24 hours
        });
        // return the information including token as JSON
        res.json({
          success: true,
          message: "Enjoy your token!",
          token
        });
      }
    }
  });
});
router.post("/authenticateComsistelco", function(req, res) {
  // find the user
  if(req.body.username !== "comsistelco"){
    return res.json({
      success: false,
      message: "Usuario incorrecto"
    });
  }
  else
  User.findOne({
    username: req.body.username
  }).select("_id  username password ").exec(function(err, user) {
    if (err) throw err;

    // no user with that username was found
    if (!user) {
      res.json({
        success: false,
        message: "Usuario incorrecto"
      });
    } else {
      // check if password matches
      var validPassword = user.comparePassword(req.body.password);
      if (!validPassword) {
        res.json({
          success: false,
          message: "Contraseña incorrecta"
        });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign({
          _id: user.id,
          name: user.name,
          username: user.username,
        }, superSecret, {
          expiresIn: '24h' // expires in 24 hours
        });
        // return the information including token as JSON
        res.json({
          success: true,
          message: "Enjoy your token!",
          token
        });
      }
    }
  });
});
function checkToken (req, res, next){
  // do logging
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers["x-access-token"];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, superSecret, function(err, decoded) {
      if (err)
      return res.json({ success: false, message: "Failed to authenticate token." });
      else
      // if everything is good, save to request for use in other routes
      req.decoded = decoded;
    });
  } else {
    // if there is no token
    // return an HTTP response of 403 (access forbidden) and an failed message
    return res.status(403).send({
      success: false,
      message: "No token provided."
    });
  }
  next(); // make sure we go to the next routes and don"t stop here
}
// router.use(function(req, res, next) {
//   // do logging
//   // check header or url parameters or post parameters for token
//   var token = req.body.token || req.query.token || req.headers["x-access-token"];
//   // decode token
//   if (token) {
//     // verifies secret and checks exp
//     jwt.verify(token, superSecret, function(err, decoded) {
//       if (err)
//       return res.json({ success: false, message: "Failed to authenticate token." });
//       else
//       // if everything is good, save to request for use in other routes
//       req.decoded = decoded;
//     });
//   } else {
//     // if there is no token
//     // return an HTTP response of 403 (access forbidden) and an failed message
//     return res.status(403).send({
//       success: false,
//       message: "No token provided."
//     });
//   }
//   next(); // make sure we go to the next routes and don"t stop here
// });
router.post("/uploadPicture",checkToken, multer.single("image"), imgUpload.uploadToGcs, function(request, response, next) {
  const data = request.body;
  if (request.file && request.file.cloudStoragePublicUrl) {
    data.imageUrl = request.file.cloudStoragePublicUrl;
  }
  return response.json(data);
});
router.get("/getProduct", function(request, response, next) {
  Product.findOne({_id:request.query._id}, (err, doc)=>{
    if (err)
    return response.send(err);
    else{
      return response.json({success:true, product:doc});
    }
  })
});
router.get("/getMainProducts", function(request, response, next) {
  Product.find({main:true}, (err, docs)=>{
    if (err)
    return response.send(err);
    else{
      return response.json({success:true, products:docs});
    }
  })
});
router.get("/getProductsByBrand", function(request, response, next) {
  Product.find({brand:request.query.brand}, (err, doc)=>{
    if (err)
    return response.send(err);
    else{
      return response.json({success:true, products:doc});
    }
  })
});
router.get("/getCorporateProductsCategories", function(request, response, next) {
  Category.find({type:"CorporateProducts"}, function(err, docs){
    response.json({categories:(docs||[])});
  }
)
});
router.get("/getCategories", function(request, response, next) {
  Category.find({}, function(err, docs){
    response.json({categories:(docs||[])});
  }
)
});
router.get("/getMainCategories", function(request, response, next) {
  Category.find({main:true}, function(err, docs){
    response.json({categories:(docs||[])});
  }
)
});

router.get("/getHomeProductsCategories", function(request, response, next) {
  Category.find({type:"HomeProducts"}, function(err, docs){
    response.json({categories:(docs||[])});
  }
)
});

router.get("/getCorporateProducts", function(request, response, next) {
  if(request.query.category==="Productos para el negocio"){
    Product.find({type:"CorporateProducts"}, function(err, docs){
      response.json({products:(docs||[])});
    })
  }
  else{
    Product.find({type:"CorporateProducts", category:request.query.category}, function(err, docs){
      response.json({products:(docs||[])});
    })
  }
});

router.get("/getHomeProducts", function(request, response, next) {
  if(request.query.category==="Productos para el hogar"){
    Product.find({type:"HomeProducts"}, function(err, docs){
      response.json({products:(docs||[])});
    });
  }
  else{
    Product.find({type:"HomeProducts", category:request.query.category}, function(err, docs){
      response.json({products:(docs||[])});
    });
  }
});

router.get("/getHomeProductsTotal", function(request, response, next) {
  Product.find({type:"HomeProducts"}, function(err, docs){
    response.json({products:(docs||[])});
  })
});
router.get("/getCorporateProductsTotal", function(request, response, next) {
  Product.find({type:"CorporateProducts"}, function(err, docs){
    response.json({products:(docs||[])});
  })
});
router.post("/addCategory",checkToken, function(request, response, next) {
  let category = new Category();
  category.name = request.body.name.trim();
  category.type = request.body.type;
  category.image = request.body.image;
  category.description = request.body.description;
  category.main = request.body.main;
  category.save(function(err) {
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, message:"¡Categoría añadida!"});
    }
  });

});
router.get("/getCategory", function(request, response, next) {
  Category.findOne({ name:request.query.category}, function(err, docs){
    response.json({category:docs});
  })
});
router.post("/addProduct",checkToken, function(request, response, next) {
  let product = new Product();
  product.price = request.body.price;
  product.dDescription = request.body.dDescription;
  product.characteristics = request.body.characteristics;
  product.tags = request.body.tags;
  product.sImages = request.body.sImages;
  product.specs = request.body.specs;
  product.image = request.body.image;
  product.name = request.body.name;
  product.bDescription = request.body.bDescription;
  product.type = request.body.type;
  product.category = request.body.category;
  product.link = request.body.link;
  product.oldPrice= (request.body.oldPrice||"0");
  product.reference= request.body.reference;
  product.brand= request.body.brand;
  product.main= request.body.main;

  product.inCarousel= request.body.inCarousel;
  product.save(function(err, p) {
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, message:"¡Producto añadido!", _id:p._id});
    }
  });
});

router.delete("/deleteCategory",checkToken, function(request, response, next) {
  Product.find({ category:request.body.category }).remove().exec((err)=>{
    if(err)
    return response.send(err);
    else{
      Category.find({ name:request.body.category }).remove().exec((error)=>{
        if (error)
        return response.send(error);
        else
        return response.json({success:true, message:"¡Categoría eliminada!"});
      });
    }
  });

});

router.put("/updateCategory",checkToken, function(request, response, next) {
  let oCat = request.body.oldCategory.trim();
  let nCat = request.body.newCategory.trim();
  Category.findOne({ name:oCat }, (err, category) =>{
    category.name = nCat;
    category.description = request.body.newDescription;
    category.image = request.body.newImage==="same"?category.image:request.body.newImage;
    category.main = request.body.main;

    category.save((err)=>{
      if (err)
      return response.send(error);
      else{

        Product.find({category:oCat}, (err, docs)=>{

          for(let product of docs){
            product.category = nCat;
            product.save((error)=>{
              if (error){
                return response.send(error);
              }
            });
          }
          return response.json({success:true, message:"¡Categoría modificada!"});

        });

      }
    });
  });
});
router.delete("/deleteProduct",checkToken, function(request, response, next) {
  Product.findOne({ _id:request.body.id }).remove().exec((err)=>{
    if(err)
    return response.send(err);
    else{
      Carousel.find({ product_id:request.body.id }).remove().exec((err)=>{
        if (err)
        return response.send(err);
        else{
          return response.json({success:true, message:"¡Producto eliminado!"});
        }
      });
    }
  });
});


router.put("/updateProduct",checkToken, function(request, response, next) {
  let newProduct = request.body;
  Product.findOne({ _id:request.body._id }, (err, product) =>{
    product.name = newProduct.name;
    product.bDescription = newProduct.bDescription;
    product.brand = newProduct.brand;
    product.link = newProduct.link;
    product.category = newProduct.category;
    product.type = newProduct.type;
    product.dDescription = newProduct.dDescription;
    product.characteristics = newProduct.characteristics;
    product.price = newProduct.price;
    product.tags = newProduct.tags;
    product.inCarousel= newProduct.inCarousel;
    product.main= newProduct.main;
    product.image = newProduct.image==="same"?product.image:newProduct.image;
    product.oldPrice= (request.body.oldPrice||"0");
    product.reference= request.body.reference;

    product.save((err)=>{
      if (err)
      return response.send(err);
      else{
        Carousel.findOne({ product_id:request.body._id }, (err, carousel) =>{
          if(carousel){
            carousel.category = newProduct.category;
            carousel.save((error)=>{
              if (error)
              return response.send(error);
              else{
                return response.json({success:true, message:"¡Producto modificado!"});
              }
            });
          }
          else{
            return response.json({success:true, message:"¡Producto modificado!"});

          }
        });
      }
    });
  });
});
router.get("/getBrands", function(request, response, next) {
  Brand.find({}, (err, docs) =>{
    if (err)
    return response.send(err);
    else{
      return response.json({success:true, brands:docs});
    }
  });
});
router.post("/addBrand",checkToken, function(request, response, next) {
  let brand = new Brand();
  brand.name = request.body.name;
  brand.image = request.body.image;

  brand.save(function(err) {
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, message:"Marca añadida!"});
    }
  });
});


router.post("/addProductToCarousel",checkToken, function(request, response, next) {
  let carousel = new Carousel ();
  carousel.product_id = request.body.product_id;
  carousel.image = request.body.image;
  carousel.category = request.body.category;

  carousel.save(err =>{
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, message:"¡Producto añadido al carrusel!"});
    }
  })
});
router.get("/getCarouselItems", function(request, response, next) {
  Carousel.find({},(err,docs)=>{
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, items:docs});
    }
  })
});
router.get("/getCarouselFromProduct", function(request, response, next) {
  Carousel.findOne({product_id:request.query.product_id},(err,doc)=>{
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, item:doc});
    }
  })
});
router.put("/updateProductCarousel",checkToken, function(request, response, next) {
  Carousel.findOne({ product_id:request.body.product_id }, (err, carousel) =>{
    carousel.image = request.body.image;
    carousel.save((error)=>{
      if (error)
      return response.send(error);
      else{
        return response.json({success:true, message:"¡Producto modificado!"});
      }
    });
  });
});
router.delete("/deleteProductFromCarousel",checkToken, function(request, response, next) {
  Carousel.find({ product_id:request.body.product_id }).remove().exec((err)=>{
    if (err)
    return response.send(err);
    else{
      return response.json({success:true, message:"¡Producto modificado!"});
    }
  });
});
router.get("/search", function(request, response, next) {

  let tag = new RegExp(".*"+request.query.search.toLowerCase()+".*")
  Product.find({tags: tag },(err,docs)=>{
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, products:docs});
    }
  });
});

router.post("/sendEmail",checkToken, function(request, response, next) {
  let {emailjsUserId,emailjsAccessToken, emailjsTemplateId,emailjsServiceId} = config;

  let data = {
    service_id: emailjsServiceId,
    template_id: emailjsTemplateId,
    user_id: emailjsUserId,
    template_params:{user_name:request.body.userName,user_email:request.body.userEmail,subject:request.body.subject,message:request.body.message}
  };
  fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    contentType: 'application/json'
  }).then((res)=> {
    return response.json({success:true, message:"Mensaje enviado!"});

  }).catch((error)=> {
    console.error(error);
    return response.send(error);

  });
});



//---------------------COMSISTELCO API-------------------------------------------------------
router.post("/page", checkToken,function(request, response, next) {
  Page.findOne({url: request.body.url },(err,page)=>{
    if (page) {
      return response.json({success:false, message:"¡Una página con ese nombre ya existe!"});
    }
    else{
      let page = new Page();
      page.name = request.body.name;
      page.url = request.body.url;
      page.sections = request.body.sections;
      page.image = request.body.image;
      page.pageCategory = request.body.pageCategory;

      page.save((err)=>{
        if (err)
        return response.send(err);
        else{
          return response.json({success:true, message:"¡Página añadida!"});
        }
      });
    }
  });
});
router.get("/page",function(request, response, next) {

  let url = request.query.url;
  Page.findOne({url: url },(err,page)=>{
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, page:page});
    }
  });


});
router.get("/pages",function(request, response, next) {

  Page.find({},(err,pages)=>{
    if (err) {
      return response.send(err);
    }
    else{
      return response.json({success:true, pages:pages});
    }
  });


});
router.put("/page",checkToken,function(request, response, next) {

  let originalUrl = request.body.originalUrl;
  Page.findOne({url: originalUrl },(err,page)=>{
    if (err) {
      return response.send(err);
    }
    else{
      page.name = request.body.name;
      page.pageCategory = request.body.pageCategory;

      if(request.body.image !== "same"){
        page.image = request.body.image;
      }
      page.url = request.body.url;
      if(request.body.sections){

        page.sections = request.body.sections;
      }
      page.save((err)=>{
        if (err)
        return response.send(err);
        else{
          return response.json({success:true, message:"¡Página modificada!"});
        }
      });
    }
  });
});

router.delete("/page",checkToken, function(request, response, next) {
  Page.find({ url:request.body.url }).remove().exec((err)=>{
    if(err)
    return response.send(err);
    else{
      return response.json({success:true, message:"¡Página eliminada!"});
    }
  });

});

router.post("/section", checkToken,function(request, response, next) {
  Page.findOne({url: request.body.page.url },(error,page)=>{
    if(error ){
      return response.send(error);
    }
    else{
      if (page) {
        page.sections.push({title:request.body.title, content:request.body.content, page:request.body.page.name, images:request.body.images})
        page.save((err, newPage)=>{
          if (err){
            console.error(err);
            return response.send(err);
          }
          else{
            return response.json({success:true, message:"seccion añadida a la página", id:newPage.sections[newPage.sections.length-1]._id});
          }
        });
      }
      else{
        return response.json({success:false, message:"No se ha encontrado la página"});

      }
    }
  });
});
router.put("/section", checkToken,function(request, response, next) {
  Page.findOne({url: request.body.page.url },(error,page)=>{
    if(error ){
      return response.send(error);
    }
    else{
      if (page) {
        let section = request.body;
        for (var i = 0; i < page.sections.length; i++) {
          if(page.sections[i]._id.equals(section._id) ){
            page.sections[i].title = section.title;
            page.sections[i].content = section.content;
            break;
          }
        }
        page.save((err)=>{
          if (err){
            console.error(err);
            return response.send(err);
          }
          else{
            return response.json({success:true, message:"seccion editada"});
          }
        });
      }
      else{
        return response.json({success:false, message:"No se ha encontrado la página"});

      }
    }
  });
});
router.delete("/section", checkToken,function(request, response, next) {
  Page.findOne({url: request.body.page.url },(error,page)=>{
    if(error ){
      return response.send(error);
    }
    else{
      if (page) {

        let section = request.body;
        for (var i = 0; i < page.sections.length; i++) {

          if(page.sections[i]._id.equals(section._id) ){
            page.sections.splice(i,1);
            break;
          }
        }
        page.save((err)=>{
          if (err){
            console.error(err);
            return response.send(err);
          }
          else{
            return response.json({success:true, message:"seccion eliminada de la página"});
          }
        });
      }
      else{
        return response.json({success:false, message:"No se ha encontrado la página"});

      }
    }
  });
});
router.get("/pageCategories", function(request, response, next) {
  PageCategory.find({},(error,pageCats)=>{
    if(error ){
      return response.send(error);
    }
    else{
      return response.json({success:true, pageCategories:pageCats});
    }
  });
});
router.post("/pageCategory", checkToken,function(request, response, next) {
  PageCategory.findOne({name: request.body.name },(error,pageCategory)=>{
    if(error ){
      return response.send(error);
    }
    else{
      if (pageCategory) {
        return response.json({success:false, message:"Ya existe una categoría con ese nombre."});

      }
      else{
        const page = new PageCategory();
        page.name = request.body.name;
        page.location = request.body.location;

        page.save((err, newPage)=>{
          if (err){
            console.error(err);
            return response.send(err);
          }
          else{
            return response.json({success:true, message:"Categoría añadida"});
          }
        });
      }
    }
  });
});
router.put("/pageCategory", checkToken,function(request, response, next) {
  PageCategory.findOne({name: request.body.name },(error,pageCategory)=>{
    if(error ){
      return response.send(error);
    }
    else{
      if (pageCategory) {
        pageCategory.name = request.body.name;
        pageCategory.location = request.body.location;
        pageCategory.save((err)=>{
          if (err){
            console.error(err);
            return response.send(err);
          }
          else{
            return response.json({success:true, message:"Categoría editada"});
          }
        });
      }
      else{
        return response.json({success:false, message:"No se ha encontrado la categoría"});

      }
    }
  });
});
router.delete("/pageCategory", checkToken,function(request, response, next) {
  Page.find({pageCategory:request.body.name}, (error,pages)=>{
      if(error){
        response.send(err)

      }
      else if(pages && pages.length > 0){
        return response.json({success:false, message:"No puede elminar categorías que contengan páginas dentro"});
      }
      else {
        PageCategory.find({name: request.body.name }).remove().exec(err=>{
          if(err){
            response.send(err)
          }
          else{
            return response.json({success:true, message:"Categoria elíminada"});

          }
        });
      }
  })

});

  router.get("/blogPage",function(request, response, next) {

    let url = request.query.url;
    BlogPage.findOne({url: url },(err,blogPage)=>{
      if (err) {
        return response.send(err);
      }
      else{
        return response.json({success:true, blogPage});
      }
    });


  });
  router.get("/blogPages",function(request, response, next) {

    BlogPage.find({},(err,blogPages)=>{
      if (err) {
        return response.send(err);
      }
      else{
        return response.json({success:true, blogPages});
      }
    });


  });
  router.post("/blogPage", checkToken,function(request, response, next) {
    BlogPage.findOne({url: request.body.url },(err,blogPage)=>{
      if (blogPage) {
        return response.json({success:false, message:"¡Una página con ese nombre ya existe!"});
      }
      else{
        let page = new BlogPage();
        page.name = request.body.name;
        page.url = request.body.url;
        page.entries = request.body.entries;
        page.pageCategory = request.body.pageCategory;
        page.save((err)=>{
          if (err)
          return response.send(err);
          else{
            return response.json({success:true, message:"¡Página añadida!"});
          }
        });
      }
    });
  });
  router.put("/blogPage",checkToken,function(request, response, next) {

    let originalUrl = request.body.originalUrl;
    BlogPage.findOne({url: originalUrl },(err,page)=>{
      if (err) {
        return response.send(err);
      }
      else{
        page.name = request.body.name;
        page.pageCategory = request.body.pageCategory;

        page.url = request.body.url;
        page.save((err)=>{
          if (err)
          return response.send(err);
          else{
            return response.json({success:true, message:"¡Página modificada!"});
          }
        });
      }
    });
  });

  router.delete("/blogPage",checkToken, function(request, response, next) {
    BlogPage.find({ url:request.body.url }).remove().exec((err)=>{
      if(err)
      return response.send(err);
      else{
        return response.json({success:true, message:"¡Página eliminada!"});
      }
    });

  });
  router.post("/entry", checkToken,function(request, response, next) {
    BlogPage.findOne({name: request.body.blogPage.name },(error,blogPage)=>{
      if(error ){
        return response.send(error);
      }
      else{
        console.log(request.body);
        if (blogPage) {
          const event = new Date();
          const options = {  year: 'numeric', month: 'numeric', day: 'numeric',hour:"numeric",minute:"numeric",second:"numeric" };
          blogPage.entries.push({title:request.body.title,
                                content1:request.body.content1,
                                content2:request.body.content2,
                                content3:request.body.content3,
                                content4:request.body.content4,
                                blogPage:request.body.blogPage.name,
                                image:request.body.image,
                                thumbNail:request.body.thumbNail,
                                date:event.toLocaleDateString('ES-CO', options).toString()})
          blogPage.save((err, newBlogPage)=>{
            if (err){
              console.error(err);
              return response.send(err);
            }
            else{
              return response.json({success:true, message:"Entrada añadida a la página", id:newBlogPage.entries[newBlogPage.entries.length-1]._id});
            }
          });
        }
        else{
          return response.json({success:false, message:"No se ha encontrado la página"});

        }
      }
    });
  });
  router.put("/entry", checkToken,function(request, response, next) {
    BlogPage.findOne({name: request.body.blogPage.name },(error,blogPage)=>{
      if(error ){
        return response.send(error);
      }
      else{
        if (blogPage) {
          let entry = request.body;
          for (var i = 0; i < blogPage.entries.length; i++) {
            if(blogPage.entries[i]._id.equals(entry._id) ){
              blogPage.entries[i].title = entry.title;
              blogPage.entries[i].content1 = entry.content1;
              blogPage.entries[i].content2 = entry.content2;
              blogPage.entries[i].content3 = entry.content3;
              blogPage.entries[i].content4 = entry.content4;
              break;
            }
          }
          blogPage.save((err)=>{
            if (err){
              console.error(err);
              return response.send(err);
            }
            else{
              return response.json({success:true, message:"Entrada editada"});
            }
          });
        }
        else{
          return response.json({success:false, message:"No se ha encontrado la página"});

        }
      }
    });
  });
  router.delete("/entry", checkToken,function(request, response, next) {
    BlogPage.findOne({name: request.body.blogPage.name },(error,blogPage)=>{
      if(error ){
        return response.send(error);
      }
      else{
        if (blogPage) {

          let entry = request.body;
          for (var i = 0; i < blogPage.entries.length; i++) {

            if(blogPage.entries[i]._id.equals(entry._id) ){
              blogPage.entries.splice(i,1);
              break;
            }
          }
          blogPage.save((err)=>{
            if (err){
              console.error(err);
              return response.send(err);
            }
            else{
              return response.json({success:true, message:"Entrada eliminada de la página"});
            }
          });
        }
        else{
          return response.json({success:false, message:"No se ha encontrado la página"});

        }
      }
    });
  });
  router.get("/checkToken",checkToken,function(request, response, next) {
    return response.json({success:true, message:"Valid token"});
    });

module.exports = router;
