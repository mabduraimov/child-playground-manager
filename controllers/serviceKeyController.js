const ServiceKey = require('../models/ServiceKey');
const ServiceKeyLog = require('../models/ServiceKeyLog');

// Список ключей с подсчётом использования
exports.listKeys = async (req, res) => {
  const keys = await ServiceKey.aggregate([
    { $sort: { createdAt: -1 } },
    { $lookup: {
        from: 'servicekeylogs',
        localField: '_id',
        foreignField: 'serviceKey',
        as: 'logs'
    }},
    { $addFields: { usageCount: { $size: '$logs' } } },
    { $project: { code: 1, description: 1, createdAt: 1, usageCount: 1 } }
  ]);
  res.render('admin/serviceKeys', {
    user: req.session.user,
    keys
  });
};

exports.newKeyForm = (req, res) => {
  res.render('admin/serviceKeyForm', { user: req.session.user, key: null });
};

exports.createKey = async (req, res) => {
  const { code, description } = req.body;
  try {
    await ServiceKey.create({ code, description });
    res.redirect('/admin/service-keys');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при создании ключа');
  }
};

exports.deleteKey = async (req, res) => {
  const id = req.params.id;
  try {
    await ServiceKey.findByIdAndDelete(id);
    // опционально: убрать логи
    await ServiceKeyLog.deleteMany({ serviceKey: id });
    res.redirect('/admin/service-keys');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при удалении ключа');
  }
};

exports.listLogs = async (req, res) => {
  // агрегируем: сколько раз и когда
  const logs = await ServiceKeyLog.find()
    .populate('serviceKey', 'code')
    .sort({ timestamp: -1 });
  res.render('admin/serviceKeyLogs', { user: req.session.user, logs });
};


// Логи активаций для конкретного ключа
exports.keyLogs = async (req, res) => {
  const keyId = req.params.id;
  const key   = await ServiceKey.findById(keyId);
  if (!key) {
    return res.status(404).send('Ключ не найден');
  }
  const logs = await ServiceKeyLog.find({ serviceKey: keyId })
    .sort({ timestamp: -1 });
  res.render('admin/serviceKeyLogs', {
    user: req.session.user,
    serviceKey: key,
    logs
  });
};
