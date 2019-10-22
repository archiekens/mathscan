import { Component, ViewChild} from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { AlertController } from '@ionic/angular';
import { IonInfiniteScroll } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;

  word = '';
  words = [];
  limit = 10;
  offset = 0;
  db = null;
  disableLoad = false;

  constructor(
    private sqlite: SQLite,
    public alertController: AlertController
  ) {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    })
      .then((db: any) => {
        this.db = db;
        this.getWords();
      });
  }

  search() {
    this.words = [];
    this.offset = 0;
    this.getWords();
  }

  loadMore(event) {
    this.offset += this.limit;
    this.getWords();
    // setTimeout(() => {
    //   this.getWords();
    //   event.timeout.complete();
    // }, 500);
  }

  async openModal(word) {
    const alert = await this.alertController.create({
      header: word.term,
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
