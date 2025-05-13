const express = require('express');
const router = express.Router();
const serviceKeyCtrl = require('../controllers/serviceKeyController');
const ctrl = require('../controllers/serviceKeyController');

// Список ключей
router.get('/', serviceKeyCtrl.listKeys);

// Форма добавления
router.get('/new', serviceKeyCtrl.newKeyForm);
// Сохранение нового
router.post('/new', serviceKeyCtrl.createKey);

// Удаление ключа
router.post('/:id/delete', serviceKeyCtrl.deleteKey);

// Логи по конкретному ключу
router.get('/:id/logs',    ctrl.keyLogs);

module.exports = router;
