import { Component } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Camera, PictureSourceType, DestinationType } from '@ionic-native/camera/ngx';
import * as Tesseract from 'tesseract.js'
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  selectedImage: string;
  imageText: string;
  progress: number;
  isScanning: boolean = false;

  constructor(
    private sqlite: SQLite,
    private sqlitePorter: SQLitePorter,
    private http: HttpClient,
    private camera: Camera,
    private actionSheetCtrl: ActionSheetController,
  ) {}

  ngOnInit() {
    this.http.get('assets/words.txt', {responseType: 'text'})
        .subscribe(query => {
          this.sqlite.create({
            name: 'data.db',
            location: 'default'
          })
            .then((db: any) => {
               db.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='words';", [])
                .then((resultSet) => {
                  if (!resultSet.rows.item(0)) {
                    let sql = query
                    this.sqlitePorter.importSqlToDb(db, sql)
                      .then(() => {
                       console.log('Import successful');
                      })
                      .catch(e => console.error(e));
                  }
                })
                .catch(e => console.log(e));
            });
        });
  }

  async selectSource() {    
    let actionSheet = await this.actionSheetCtrl.create({
      buttons: [
        {
          text: 'Use Library',
          handler: () => {
            this.getPicture(PictureSourceType.PHOTOLIBRARY);
          }
        }, {
          text: 'Capture Image',
          handler: () => {
            this.getPicture(PictureSourceType.CAMERA);
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
      quality: 50,
      targetHeight: 512,
      targetWidth: 512,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: sourceType,
      allowEdit: false,
      saveToPhotoAlbum: false,
      correctOrientation: true
    }).then((imageData) => {
      this.selectedImage = `data:image/jpeg;base64,${imageData}`;
    });

  }

  recognizeImage() {
    this.isScanning = true;
    Tesseract.recognize(this.selectedImage)
    .progress(message => {
      console.log(message);
      this.progress = message.progress;
    })
    .then(result => {
      this.imageText = result.text;
      this.progress = 1;
      this.isScanning = false;
    })
    .catch(err => {
      this.isScanning = false;
      console.error(err)
    });
  }

}
