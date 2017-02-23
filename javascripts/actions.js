import { SHOW, HIDE, ADD_BOOK, EDIT_BOOK, REMOVE_BOOK, INSTRUCTIONS } from './consts';
import initializeURL from '../lib/init';
const Epub = require('epub');
import Promise from 'promise';
import DB from '../lib/database';

const Config = DB('config');

export function addBook(name, author, data) {
  return {
    type: ADD_BOOK
  }
}

export function editBook(i, data) {
  return {
    type: EDIT_BOOK,
    data,
    i
  }
}


export function deleteBook(i) {
  return {
    type: REMOVE_BOOK,
    i
  }
}

export function updateLoader(type) {
  return {
    type
  }
}

export function updateStore(type, data) {
  return {
    type,
    data
  }
}

export function showError(type, error) {
  console.error(error);
  return {
    type,
    error
  }
}

export function read(url, i) {
    let book = new Epub(url, `/${i}/image/`, `/${i}/read/`);
    const promise = new Promise((resolve, reject) => {
      book.on('end', () => resolve(book));
      book.on('error', () => reject('error reading file'));
    });
    book.parse();
    return promise;
}

function createBook(metadata) {
  return {
    title: metadata.title,
    author: metadata.creator,
    subject: metadata.subject,
    description: metadata.description,
    pubDate: metadata.date,
    cover: metadata.cover
  }
}

export function getImage(book, imgId) {
  return new Promise((resolve, reject) => {
    if(!imgId)
      resolve('./glass.png');
    book.getImage(imgId, function(err, img, mimeType) {
      if(!!err) reject(err);
      resolve(`data:${mimeType || 'image/jpeg'};base64,${img.toString('base64')}`);
    });
  });
}


function initEbook(book, i) {
  return new Promise((resolve, reject) => {
        let metadata = createBook(book);
        getImage(book, metadata.cover)
        .then(img => {
          metadata.cover = img;
          metadata.chapters = book.flow;
          resolve(metadata);
        }).catch(reject);
    });
}

export function initializeStore() {
  return function(dispatch) {
    Config.get().then(config => {
    const dir = (config.directory === 'default') ? process.env.HOME : config.directory;
    dispatch(updateLoader(SHOW));

    initializeURL(dir, config.extensions).then(books => {
        dispatch(updateStore('NEW', books));
        dispatch(updateForm('', books.map((_, i) => i)));
        dispatch(updateLoader(HIDE));
        dispatch(changeWelcomeMessage(0));
        return dispatch(showWelcome());

    }).catch(e => { dispatch(showError('LOG', e)) });
  });
  }
}



export function setFormValues(values) {
  return {
    type: 'UPDATE_VALUE',
    values
  }
}

export function updateForm(style, matches) {
  return function (dispatch) {
    dispatch(setFormValues({ style }));
    return dispatch(updateMatches(matches));
  }
}

export function updateMatches(matches) {
  return {
    type: 'UPDATE_MATCH',
    data: matches
  }
}

function getChapter(book, chapterId) {
  return new Promise((resolve, reject) => {
    book.getChapter(chapterId, function(err, text) {
      if(err) reject(err);
      resolve(text);
    });
  });
}

export function updateChapter(bookId, i, data) {
  console.log(data);
  return {
    type: 'UPDATE_CHAPTER',
    bookId,
    i,
    data
  }
}


export function updateReadable(type, data=null, e=null) {
  return function(dispatch) {
    if(e) dispatch(showError('LOG', e));
    else return dispatch({
      type,
      data
    });
  }
}

export function startReading() {
  return function(dispatch) {
    return dispatch({
      type: 'START_TIMER'
    });
  }
}

export function stopReading() {
  return function(dispatch) {
    return dispatch({
      type: 'STOP_TIMER'
    });
  }
}

export function toggleWelcome() {
  return function(dispatch) {
    return dispatch(showWelcome());
  }
}

export function showWelcome() {
  return {
    type: 'TOGGLE_WELCOME'
  }
}

export function updateMessage(i) {
  return function(dispatch) {
    return dispatch(changeWelcomeMessage(i));
  }
}

export function changeWelcomeMessage(i=0) {
  return {
    type: 'UPDATE_MESSAGE',
    i,
    data: INSTRUCTIONS[i]
  }
}

export function removeInstrucions(key) {
  return {
    type: 'REMOVE_INSTRUCTION',
    key
  }
}