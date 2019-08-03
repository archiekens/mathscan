import { Component, NgZone } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Camera, PictureSourceType, DestinationType } from '@ionic-native/camera/ngx';
import * as Tesseract from 'tesseract.js'
import { ActionSheetController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { IonInfiniteScroll } from '@ionic/angular';
import { FilePath } from '@ionic-native/file-path/ngx';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  selectedImage = '/assets/default.jpg';
  word: string;
  progress: number;
  isScanning: boolean = false;
  status: string = "Idle";
  words = [];
  limit = 10;
  offset = 0;
  db = null;
  disableLoad = false;
  tesseract;

  constructor(
    private sqlite: SQLite,
    private sqlitePorter: SQLitePorter,
    private http: HttpClient,
    private camera: Camera,
    private actionSheetCtrl: ActionSheetController,
    private zone: NgZone,
    public alertController: AlertController,
    private filePath: FilePath,
    private file: File,
  ) {
      this.tesseract = Tesseract.create({
        langPath: file.applicationDirectory + 'www/assets/lib/tesseract.js-',
        corePath: file.applicationDirectory + 'www/assets/lib/tesseract.js-core_0.1.0.js',
        workerPath: file.applicationDirectory + 'www/assets/lib/tesseract.js-worker_1.0.10.js',
      });
  }

  ngOnInit() {
    // this.http.get('assets/words.txt', {responseType: 'text'})
    //     .subscribe(query => {
    //       this.sqlite.create({
    //         name: 'data.db',
    //         location: 'default'
    //       })
    //         .then((db: any) => {
    //            this.db = db;
    //            db.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='words';", [])
    //             .then((resultSet) => {
    //               if (!resultSet.rows.item(0)) {
    //                 let sql = query
    //                 this.sqlitePorter.importSqlToDb(db, sql)
    //                   .then(() => {
    //                    console.log('Import successful');
    //                   })
    //                   .catch(e => console.error(e));
    //               }
    //             })
    //             .catch(e => console.log(e));
    //         });
    //     });
  }

  async selectSource() {    
    let actionSheet = await this.actionSheetCtrl.create({
      buttons: [
        {
          text: 'Take picture',
          handler: () => {
            this.getPicture(PictureSourceType.CAMERA);
          }
        },
        {
          text: 'Choose file',
          handler: () => {
            this.getPicture(PictureSourceType.PHOTOLIBRARY);
          }
        }, {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    actionSheet.present();
  }
 
  getPicture(sourceType: PictureSourceType) {
    this.camera.getPicture({
      quality: 100,
      targetHeight: 480,
      targetWidth: 720,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: sourceType,
      allowEdit: true,
      saveToPhotoAlbum: false,
      correctOrientation: true
    }).then((imageData) => {
      this.selectedImage = `data:image/jpeg;base64,${imageData}`;
      this.recognizeImage();
    });

  }

  recognizeImage() {
    this.progress = 0;
    this.isScanning = true;
    this.status = "Scanning";
    Tesseract.recognize(this.selectedImage, {lang:'eng'})
    .progress(message => {
      console.log(message);
      this.zone.run(() => {
        if (message.status == "recognizing text") {
          this.progress = message.progress;
        }
      });
    })
    .then(result => {
      this.zone.run(() => {
        this.word = result.text.toLowerCase().trim();
        this.progress = 1;
        this.isScanning = false;
        this.status = "Done!";
        this.search();
      });
    })
    .catch(err => {
      this.isScanning = false;
      console.log(err);
    });
  }

  search() {
    this.words = [];
    this.offset = 0;
    this.getWords();
  }

  loadMore(event) {
    var e = event;
    this.offset += this.limit;
    this.getWords();
    // setTimeout(() => {
    //   this.getWords();
    //   e.timeout.complete();
    // }, 500);
  }

  async openModal(word) {
    const alert = await this.alertController.create({
      message: word.definition,
      buttons: ['Close']
    });

    await alert.present();
  }

  getWords() {
    this.disableLoad = true;
    this.db.executeSql("SELECT * FROM words WHERE term LIKE '" + this.word + "%' ORDER BY term COLLATE NOCASE ASC LIMIT " + this.limit + " OFFSET " + this.offset, [])
      .then((resultSet) => {
        for(var x = 0; x < resultSet.rows.length; x++) {
          this.words.push({
            term: resultSet.rows.item(x).term,
            definition: resultSet.rows.item(x).definition
          });
        }
        if (resultSet.rows.length != 0) {
          this.disableLoad = false;
        }
      })
      .catch(e => {
        this.disableLoad = true;
        console.log(e)
      });
  }

}
