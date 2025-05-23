const Equipment = require('../models/Equipment');
const PassLog = require('../models/PassLog');
const AttractionLog = require('../models/AttractionLog');
const ServiceKey      = require('../models/ServiceKey');
const ServiceKeyLog   = require('../models/ServiceKeyLog');

exports.api = async (req, res) => {
  const { passIds, code } = req.body;
  try {
    // Если передан код INIT – обновляем базу и сразу отвечаем, без отправки запросов на турникеты
    if (code && code === 'INIT') {
      await Promise.all(passIds.map(id =>
        PassLog.findOneAndUpdate(
          { passId: id },
          { status: 'activeEntrance' },
          { upsert: true, new: true }
        )
      ));
      return res.status(200).json({ message: 'INIT обработан' });
    }
    
    // Определяем оборудование по IP запроса
    let clientIp = req.ip;
    if (clientIp.startsWith("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }
    const equipment = await Equipment.findOne({ ip: clientIp });
    if (!equipment) {
      return res.status(404).json({ message: `Оборудование не найдено по IP: ${clientIp}` });
    }

    // Проверяем, есть ли в passIds совпадения с ServiceKey.code
    const keys = await ServiceKey.find({ code: { $in: passIds } });
    if (keys.length > 0) {
      // Логируем каждую активацию
      await Promise.all(keys.map(key =>
        ServiceKeyLog.create({
          serviceKey: key._id,
          equipmentIp: clientIp
        })
      ));
	  return res.status(200).json({ message: 'Сервисный ключ активирован' });
    }
    
    // Если оборудование имеет тип "аттракцион", для каждого passId создаём запись посещения
    if (equipment.type === 'аттракцион') {
      await Promise.all(passIds.map(async (id) => {
        try {
          await AttractionLog.create({ equipment: equipment._id, passId: id });
        } catch (err) {
          console.error(err);
        }
      }));
      return res.status(200).json({ message: 'Данные аттракциона сохранены' });
    }
    
    // Для оборудования типа "Вход" или "Выход" нужно проверить корректность переданных passIds.
    // Определяем ожидаемый статус в PassLog для текущего оборудования:
    let expectedStatus;
    if (equipment.type === 'Вход') {
      expectedStatus = 'activeEntrance';
    } else if (equipment.type === 'Выход') {
      expectedStatus = 'activeExit';
    } else {
      return res.status(400).json({ message: 'Неверный тип оборудования' });
    }
	
	 // Определяем, какой статус нужно установить после проверки
	const reversedStatus = expectedStatus === 'activeEntrance'
	  ? 'activeExit'
	  : 'activeEntrance';   
	  
    // Проверяем для каждого passId, что запись существует и имеет ожидаемый статус
    for (let id of passIds) {
      const log = await PassLog.findOne({ passId: id });
      if (!log) {
        return res.status(400).json({ message: `Пасс с кодом ${id} не найден в базе` });
      }
      if (log.status !== expectedStatus) {
        return res.status(400).json({ 
          message: `Пасс с кодом ${id} имеет неверный статус (${log.status}). Ожидается: ${expectedStatus}` 
        });
      }
	  // Меняем статус на обратный
	  await PassLog.findOneAndUpdate(
		{ passId: id },
		{ status: reversedStatus },
		{ new: true }
	  );	  
    }
    
    // Если все проверки прошли успешно, возвращаем ответ 200
    return res.status(200).json({ message: 'Код турникета подтверждён, данные корректны' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};
