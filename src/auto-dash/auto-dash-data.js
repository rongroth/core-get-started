/* eslint no-console:0 */
const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json');
const Halyard = require('halyard.js');
const mixins = require('halyard.js/dist/halyard-enigma-mixin');

(async () => {
  try {
      console.log('Creating Halyard table data representation.');
      const halyard = new Halyard();
      const tpsPath = '/data/idps-tps.csv';
      const tpsTable = new Halyard.Table(tpsPath, {
        name: 'TPS',
        delimiter: ',',
        fields: [
            {src: 'timestamp', name: 'timestamp'},
            {src: 'TPS', name: 'TPS'}
        ]
      });

      console.log(tpsTable);

      hTable = halyard.addTable(tpsTable);

      console.log(hTable);

    console.log('Creating session app on engine.');
    const session = enigma.create({
      schema,
      mixins,
      url: 'ws://localhost:19076/app/',
      createSocket: url => new WebSocket(url),
    });
    const qix = await session.open();
    const app = await qix.createSessionAppUsingHalyard(halyard);

    // console.log("APP");
    // console.log(app);

    fields = app.g

    console.log('Creating session object with idps tps.');
    const count = 5;
    const properties = {
      qInfo: { qType: 'auto-dash' },
      qHyperCubeDef: {
        qDimensions: [
            { qDef: { qFieldDefs: ['timestamp'] } },
            { qDef: { qFieldDefs: ['TPS'] } },
        ],
        qMeasures: [],
        qInitialDataFetch: [{ qHeight: count, qWidth: 2 }]
      },
    };
    const object = await app.createSessionObject(properties);
    // console.log("OBJECT");
    // console.log(object);
    const layout = await object.getLayout();
    console.log("LAYOUT");
    console.log(layout);
    const tpss = layout.qHyperCube.qDataPages[0].qMatrix;
    console.log('TPSS layout');
    console.log(tpss);

    console.log(`Listing the first ${count} TPS:`);
    console.log('timestamp  TPS');
    tpss.forEach((tps) => {
        console.log(tps[0].qText, tps[1].qText);
    });

    // Now, create a visualization!

    



    await session.close();
    console.log('Session closed.');
  } catch (err) {
    console.log('Whoops! An error occurred.', err);
    process.exit(1);
  }
})();
