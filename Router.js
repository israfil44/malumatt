
const url = require('url');
const path = require('path'); 
const mongoose = require('mongoose');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const router = express.Router();


module.exports = router;





const app = express();


const port = 3000;

const uri = 'mongodb+srv://levent_44:Tj8u1v7xzm@blog.lrfhqog.mongodb.net/?retryWrites=true&w=majority';

// Bağlantı seçenekleri


// MongoDB'ye bağlan
mongoose.connect(uri,)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı!');
  })
  .catch((error) => {
    console.error('MongoDB bağlantı hatası:', error);
  });






  app.use(bodyParser.urlencoded({ extended: true }));










const uploadBlogFolder = path.join(__dirname, 'public', 'upload-blog');
const uploadDosyaFolder = path.join(__dirname, 'public', 'upload-dosya');

const blogStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadBlogFolder); // 'public/upload-blog' olarak değiştirildi
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix); // Dosya adı daha açık bir şekilde belirtiliyor
  }
});

const dosyaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDosyaFolder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const blogUpload = multer({ storage: blogStorage });
const dosyaUpload = multer({ storage: dosyaStorage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/gorsel', express.static(path.join(__dirname, 'public', 'upload-blog')));
app.use('/dosya', express.static(path.join(__dirname, 'public', 'upload-dosya')));






const iletisimStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadFolder, 'iletisim'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});



const upload = multer({ storage: blogStorage }); // 'upload' yerine 'blogStorage' kullanıldı

const iletisimUpload = multer({ storage: iletisimStorage });


// Mongoose veri modeli tanımla js,nodejs ve mongodb arasında bağlantı oluşturma
const BlogModel = mongoose.model('Blog', {
  ad: String,
  soyad: String,
  e_posta: String,
  gorsel: String,
  kategori: String,
  konu: String,
  icerik: String,
  dosya:String,
  onaylandi: Boolean,
});

// Dosya yükleme işlemi için endpoint'i tanımla
app.post('/public/upload-blog', blogUpload.fields([
  { name: 'ad' },
  { name: 'soyad' },
  { name: 'e_posta' },
  { name: 'gorsel' },
  { name: 'kategori' },
  { name: 'konu' },
  { name: 'icerik' },
  {name:'dosya'}
]), async (req, res) => {
  try {
    // Diğer form alanlarından verileri al
    const ad = req.body.ad;
    const soyad = req.body.soyad;
    const e_posta = req.body.e_posta;
    const gorsel = req.body.gorsel;
    const kategori = req.body.kategori;
    const konu = req.body.konu;
    const icerik = req.body.icerik;
    const dosya = req.body.dosya;

    // Yüklenecek dosyaların bilgilerini al
    const gorselFile = req.files && req.files['gorsel'] ? req.files['gorsel'][0] : null;
    const gorselDosyaAdi = gorselFile ? gorselFile.originalname : null;



    const dosyafile = req.files && req.files['dosya'] ? req.files['dosya'][0] : null;
    const dosyaAdi = dosyafile ? dosyafile.originalname : null;



    // Model oluşturma
    const blog = new BlogModel({
      ad: ad,
      soyad: soyad,
      e_posta: e_posta,
      gorsel: gorselDosyaAdi,
      kategori: kategori,
      konu: konu,
      icerik: icerik,
      dosya: dosyaAdi,
      onaylandi: false,
    });
// Veritabanındaki tüm blog öğelerini al
const blogItems = await BlogModel.find();

// Tüm blog öğelerini döngüye alarak onaylandi alanını kontrol et ve gerekirse güncelle
for (const blogItem of blogItems) {
  if (blogItem.onaylandi === undefined || blogItem.onaylandi === null) {
    // Eğer onaylandi değeri tanımlanmamışsa veya null ise false olarak güncelle
    blogItem.onaylandi = false;
    await blogItem.save();
  }
}


    // Veritabanını kayıt
    await blog.save();

    // Görseli belirli bir konuma kaydetme
    let successMessage = 'Blog başarıyla yüklendi ve veritabanına kaydedildi.';
    if (gorselFile) {
      const hedefKlasor = path.join(__dirname, 'public', 'upload-blog');
      const hedefDosyaYolu = path.join(hedefKlasor, gorselDosyaAdi);

      await fs.promises.rename(gorselFile.path, hedefDosyaYolu);
    }

    // Dosyayı belirli bir konuma kaydetme
    if (dosyafile) {
      const hedefKlasorDosya = path.join(__dirname, 'public', 'upload-dosya');
      const hedefDosyaYoluDosya = path.join(hedefKlasorDosya, dosyaAdi);

      await fs.promises.rename(dosyafile.path, hedefDosyaYoluDosya);
    }

    res.send(successMessage);

  } catch (error) {
    console.error('Blog yükleme hatası:', error);
    res.status(500).send('Blog yüklenirken bir hata oluştu.');
  }
});
///////////////////////////////////////

app.get('/dosya/:dosyaAdi', (req, res) => {
  try {
    const dosyaAdi = req.params.dosyaAdi;
    const filePath = path.join(__dirname, 'public', 'upload-dosya', dosyaAdi);

    // Dosya var mı diye kontrol et
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        console.error('Dosya bulunamadı:', err.message);
        res.status(404).end('Dosya bulunamadı');
      } else {
        // Dosya varsa gönder
        if (dosyaAdi) {
          // Content-Disposition başlığını ekleyerek dosyanın adını belirtin
          res.setHeader('Content-Disposition', `inline; filename=${dosyaAdi}`);
        }
        
        // Dosyayı gönder
        res.sendFile(filePath, (err) => {
          if (err) {
            console.error('Dosya gönderilirken hata:', err.message);
            res.status(err.status).end();
          } else {
            console.log('Dosya gönderildi:', filePath);
          }
        });
      }
    });
  } catch (error) {
    console.error('Dosya çekme hatası:', error);
    res.status(500).send('Dosya çekilirken bir hata oluştu.');
  }
});

/////////////////////////////////////////////////////////////////////////

app.get('/dosya/:dosyaAdi', (req, res) => {
  try {
    const dosyaAdi = req.params.dosyaAdi;
    const filePath = path.join(__dirname, 'public', 'upload-dosya', dosyaAdi);

    // Dosya var mı diye kontrol et
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        console.error('Dosya bulunamadı:', err.message);
        res.status(404).end('Dosya bulunamadı');
      } else {
        // Dosya varsa gönder

        // Content-Disposition başlığını ekleyerek dosyanın adını belirtin
        res.setHeader('Content-Disposition', `inline; filename=${dosyaAdi}`);
        
        // Dosyayı gönder
        res.sendFile(filePath, (err) => {
          if (err) {
            console.error('Dosya gönderilirken hata:', err.message);
            res.status(err.status).end();
          } else {
            console.log('Dosya gönderildi:', filePath);
          }
        });
      }
    });
  } catch (error) {
    console.error('Dosya çekme hatası:', error);
    res.status(500).send('Dosya çekilirken bir hata oluştu.');
  }
});



//////////////////////////////////////////////////////////////
app.post('/onaylaBlog/:blogId/:kategori', async (req, res) => {
  const blogId = req.params.blogId;
  const kategori = req.params.kategori;

  try {
    const result = await BlogModel.findByIdAndUpdate(
      blogId,
      { onaylandi: true, kategori: kategori },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ success: false, error: 'Blog bulunamadı' });
    } else {
      res.json({ success: true, message: 'Blog başarıyla onaylandı ve kaydedildi.' });
    }
  } catch (error) {
    console.error('Blog onaylama işlemi sırasında bir hata oluştu:', error);
    res.status(500).json({ success: false, error: 'İç Sunucu Hatası' });
  }
});




/////////////////////////////////////////////////////////////////////////////////





  


///////////////////////////////////////////////////////////////7//







/////////////////////////////////////////////////////////////////////////
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // İzin verilen dosya türleri
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Yalnızca JPEG, PNG ve GIF dosyalarına izin verilir.');
    error.code = 'LIMIT_FILE_TYPES';
    return cb(error, false);
  }

  cb(null, true);
};


// Mongoose veri modeli tanımla
const IletisimModel = mongoose.model('Iletisim', {
  ad: String,
  eposta: String,
  konu: String,
  mesaj: String,
});

// Iletisim formu için endpoint'i tanımla
app.post('/upload-iletisim', iletisimUpload.fields([
  { name: 'ad' },
  { name: 'eposta' },
  { name: 'konu' },
  { name: 'mesaj' },
]), async (req, res) => {
  try {
    // Diğer form alanlarından verileri al
    const ad = req.body.ad;
    const eposta = req.body.eposta;
    const konu = req.body.konu;
    const mesaj = req.body.mesaj;

    // Yüklenecek dosyaların bilgilerini al
    const adFile = req.files && req.files['ad'] ? req.files['ad'][0] : null;
    const epostaFile = req.files && req.files['eposta'] ? req.files['eposta'][0] : null;
    const konuFile = req.files && req.files['konu'] ? req.files['konu'][0] : null;
    const mesajFile = req.files && req.files['mesaj'] ? req.files['mesaj'][0] : null;

    // Model oluşturma
    const newIletisim = new IletisimModel({
      ad: ad,
      eposta: eposta,
      konu: konu,
      mesaj: mesaj,
    });

    // Veritabanını kayıt
    await newIletisim.save();

    res.send(' form verileri başarıyla kaydedildi Anasayfaya Dönebilirsin :)');
    
  } catch (error) {
    console.error('Iletisim form dosyalarını ve form verilerini işlerken hata oluştu:', error);
    res.status(500).send('İç Sunucu Hatası');
  }
});

//2
app.delete('/delete-communication/:id', async (req, res) => {
  const IletisimId = req.params.id;

  try {
    // Geçerli bir ObjectId mi kontrol et
    if (!mongoose.Types.ObjectId.isValid(IletisimId)) {
      return res.status(400).json({ success: false, error: 'Geçersiz ID formatı' });
    }

    const result = await IletisimModel.findByIdAndDelete(IletisimId);

    if (!result) {
      res.status(404).json({ success: false, error: 'Veri bulunamadı' });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Veri silme işlemi sırasında bir hata oluştu:', error);
    res.status(500).json({ success: false, error: 'İç Sunucu Hatası' });
  }
});





//1
app.delete('/delete-blog/:id', async (req, res) => {
  const blogId = req.params.id;

  try {
    const result = await BlogModel.findByIdAndDelete(blogId);

    if (!result) {
      res.status(404).json({ success: false, error: 'Blog bulunamadı' });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Blog silme işlemi sırasında bir hata oluştu:', error);
    res.status(500).json({ success: false, error: 'İç Sunucu Hatası' });
  }
});




//Static Dosyalar için public Tanımlamaları
app.use(express.static(path.join(__dirname, 'public'), { 
    setHeaders: (res, path, stat) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'text/javascript');
      }
    }
  }));

  app.get('/Anasayfa', require('./controllers/Anasayfa').get);
  app.get('/Blogolustur', require('./controllers/Blogolustur').get);
  app.get('/letisim', require('./controllers/letisim').get);
  app.get('/iletisim', require('./controllers/iletisim').get);
  app.get('/Sanat', require('./controllers/Sanat').get);
  app.get('/Admin', require('./controllers/Admin').get);
  app.post('/Admin', require('./controllers/Admin').post);
  app.get('/Bilim', require('./controllers/Bilim').get);
  app.get('/Blogistek', require('./controllers/Blogistek').get);
  app.get('/Doga', require('./controllers/Doga').get);
  app.get('/Hakkimizda', require('./controllers/Hakkimizda').get);
  app.get('/Kullanici', require('./controllers/Kullanici').get);
  app.get('/Kultur', require('./controllers/Kultur').get);
  app.get('/Login', require('./controllers/Login').get);
  app.get('/Seyahat', require('./controllers/Seyahat').get);
  app.get('/Tarih', require('./controllers/Tarih').get);
  app.get('/Teknoloji', require('./controllers/Teknoloji').get);
  app.get('/404-error', require('./controllers/404-error').get);
  

app.get('/', (req, res) => {
  
  const pathname = url.parse(req.url).pathname;

  if (pathname.match("\.css$")) {
    const cssPath = path.join(__dirname, "..", pathname);
    const fileStream = fs.createReadStream(cssPath, "UTF-8");
  
    fileStream.on('data', (data) => {
      res.write(data.toString());
    });
  
    fileStream.on('end', () => {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end();
    });
    switch (pathname) {
        case '/':
        case '/Anasayfa':
          require('./controllers/Anasayfa').get(req, res);
          break;
        case '/Blogolustur':
          require('./controllers/Blogolustur.js').post(req, res);
          break;
          case '/onaylanan-bloglar':
          require('./controllers/Onay.js').post(req, res);
          break;
        case '/letisim':
          require('./controllers/letisim.js').get(req, res);
          break;
        case '/Sanat':
          require('./controllers/Sanat.js').get(req, res);
          break;
        case '/Bilim':
          require('./controllers/Bilim.js').get(req, res);
          break;
        case '/Doga':
          require('./controllers/Doga.js').get(req, res);
          break;
        case '/Hakkimizda':
          require('./controllers/Hakkimizda.js').get(req, res);
          break;
        case '/Kullanici':
          require('./controllers/Kullanici.js').get(req, res);
          break;
        case '/Kultur':
          require('./controllers/Kultur.js').get(req, res);
          break;
        case '/Login':
          require('./controllers/Login.js').get(req, res);
          break;
          case '/iletisim':
            require('./controllers/iletisim.js').get(req, res);
            break;
        case '/Seyahat':
          require('./controllers/Seyahat.js').get(req, res);
          break;
        case '/Blogistek':
          require('./controllers/Blogistek.js').get(req, res);
          break;
        case '/Admin':
          require('./controllers/Admin.js').get(req, res);
          break;
        case '/Teknoloji':
          require('./controllers/Teknoloji.js').get(req, res);
          break;
        case '/Tarih':
          require('./controllers/Tarih.js').get(req, res);
          break;
        default:
          require('./controllers/404-error.js').get(req, res);
          break;
      }
      
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
