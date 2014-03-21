#!/usr/bin/env node

/*
 * pancanga
 * https://github.com/kollavarsham/pancanga-nodejs
 *
 * Copyright (c) 2014 The Kollavarsham Team
 * Licensed under the MIT license.
 */

/*jshint latedef: false */
'use strict';

var capitalize = require('capitalize');
var chalk = require('chalk');
var extend = require('node.extend');
var firstQuestionWithReturn = null;
var gregorianDate = new Date();
var inquirer = require('inquirer');
var Kollavarsham = require('kollavarsham');
var kollavarsham = new Kollavarsham({});
var lastListOrVerboseOperation = '';
var sprintf = require('sprintf-js').sprintf;

var firstQuestion = {
  type    : 'list',
  name    : 'topMenu',
  message : 'What do you want to do?',
  choices : ['Try', 'List', 'Verbose', 'Settings', 'Exit']
};

var settingsQuestion = {
  type    : 'list',
  name    : 'settingMenu',
  message : 'What setting do you want to change?',
  choices : ['Latitude', 'Longitude', 'Change System', 'Go Back']
};

var latitudeQuestion = {
  type     : 'input',
  name     : 'latitude',
  message  : 'Enter the latitude (valid values are between -90 and +90)',
  validate : function (value) {
    var valid = !isNaN(parseFloat(value)) && value >= -90 && value <= +90;
    return valid || 'Please enter a number between -90 and +90';
  },
  filter   : Number
};

var longitudeQuestion = {
  type     : 'input',
  name     : 'longitude',
  message  : 'Enter the longitude (valid values are between -180 and +180)',
  validate : function (value) {
    var valid = !isNaN(parseFloat(value)) && value >= -180 && value <= +180;
    return valid || 'Please enter a number between -180 and +180';
  },
  filter   : Number
};

var tryFirstQuestion = [
  {
    type    : 'list',
    name    : 'sakaVikrama',
    message : 'Saka years or Vikrama years?',
    choices : ['Saka', 'Vikrama']
  }
];

var trySecondSetOfQuestions = function (sakaOrVikrama) {
  return [
    {
      type     : 'input',
      name     : 'year' + sakaOrVikrama,
      message  : sakaOrVikrama + ' years expired',
      validate : function (value) {
        var valid = !isNaN(parseFloat(value)) && (value % 1 === 0) && value >= 0 && value <= +3000;
        return valid || 'Please enter an integer between 0 and 3000';
      },
      filter   : Number
    },
    {
      type     : 'input',
      name     : 'masaNum',
      message  : 'Enter masa by the number from ' + chalk.green('above table') +
          chalk.red(' (If purnimanta and krsna-paksa, enter the number in brackets): '),
      validate : function (value) {
        var valid = !isNaN(parseFloat(value)) && (value % 1 === 0) && value >= 0 && value <= +11;
        return valid || 'Please enter an integer between 0 and 11';
      },
      filter   : Number
    },
    {
      type    : 'list',
      name    : 'paksa',
      message : 'Sukla- or Krsnapaksa ? ',
      choices : ['Suklapaksa', 'Krsnapaksa']
    },
    {
      type     : 'input',
      name     : 'tithiDay',
      message  : 'Enter tithi by the number: ',
      validate : function (value) {
        var valid = !isNaN(parseFloat(value)) && (value % 1 === 0) && value >= 1 && value <= +15;
        return valid || 'Please enter an integer between 1 and 15';
      },
      filter   : Number
    }
  ];
};

var listVerboseQuestions = [
  {
    type     : 'input',
    name     : 'year',
    message  : 'Enter the year (valid values are between -3100 and +3000)',
    validate : function (value) {
      var valid = !isNaN(parseFloat(value)) && (value % 1 === 0) && value >= -3100 && value <= +3000;
      return valid || 'Please enter an integer between -3100 and +3000';
    },
    filter   : Number
  },
  {
    type     : 'input',
    name     : 'month',
    message  : 'Enter the month (valid values are 1 to 12)',
    validate : function (value) {
      var valid = !isNaN(parseFloat(value)) && (value % 1 === 0) && value >= 1 && value <= 12;
      return valid || 'Please enter an integer between 1 and 12';
    },
    filter   : Number
  },
  {
    type     : 'input',
    name     : 'day',
    message  : 'Enter the day (valid values are 1 to 31)',
    validate : function (value) {
      var valid = !isNaN(parseFloat(value)) && (value % 1 === 0) && value >= 1 && value <= 31;
      return valid || 'Please enter an integer between 1 and 31';
    },
    filter   : Number
  }
];

var getBanner = function () {
  return '\n' +
      '********* ' + chalk.green('Pancanga vers.3.14') + ' **********   ' + chalk.red('M. YANO and M. FUSHIMI') + '\n' +
      '----------------- perl version ------------- March 2014\n' +
      'This program is based on the Suuryasiddhaanta (ca AD 1000),\n' +
      'and also on the older constants of the Pancasiddhaantikaa (AD 505).\n\n' +
      '  ' + chalk.green.bold('Menus') + ':\n' +
      '   ' + chalk.green('Try') + '  : To find the modern date from the given Indian date.   The\n' +
      '       result is not always correct.  (Sometimes error is one month\n' +
      '       because of adhimaasa.) You should confirm it by menu \'List\'\n' +
      '  ' + chalk.green('List') + '  : To find the Indian date (in amaanta) from the given modern\n' +
      '       date.  The result is considerably reliable:  the month names\n' +
      '       are almost always correct;only the error of 1 tithi is to be\n' +
      '       admitted because of occurrence of Ksayadina or adhidina.\n' +
      '' + chalk.green('Verbose') + ' :   To get the further details of \'List\'\n' +
      '' + chalk.green('Settings') + ':   To set local \'Latitude\' & \'Longitude\' and\n' +
      '       \'System\' (\'SuryaSiddhanta\' or \'InPancasiddhantika\').\n' +
      '  NOTICE:   Remember the difference of \'amaanta\' and \'purNimaanta\'\n' +
      '            Beginning of the year is set for \'Caitra\' \'sukla\' 1.\n' +
      '  ***** This program should not be copied without our permission.\n' +
      '  Please contact:\n' +
      '         M.YANO (for Indian astronomy): yanom@cc.kyoto-su.ac.jp\n' +
      '         M.FUSHIMI (for programming): makoto.fushimi at nifty.com\n';
};

var getLatitudesBanner = function () {
  return '' +
      '   ------------------------------------------------------------ \n' +
      '  |                  Latitude                                  |\n' +
      '  |                                                            |\n' +
      '  |_____                              ______36                 |\n' +
      '  |                  *                         Srinagar:34.1   |\n' +
      '  |_____                              ______32                 |\n' +
      '  |                    *                       Delhi:28.6      |\n' +
      '  |_____                         *    ______28 Kathmandu:27.7  |\n' +
      '  |                          *                 Varanasi:25.3   |\n' +
      '  |_____ ---\\                         ______24 Ujjain:23.2     |\n' +
      '  |          \\//      *           *___         Calcutta:22.6   |\n' +
      '  |_____       \\_/|             _/~   ~_____20                 |\n' +
      '  |               |*          _/               Bombay:19.0     |\n' +
      '  |_____           \\     *  _/        ______16 Hyderabad:17.4  |\n' +
      '  |                 \\      |                                   |\n' +
      '  |_____             \\    *|          ______12 Madras:13.1     |\n' +
      '  |                   \\   /                                    |\n' +
      '  |_____               \\*/ /\\         ______08 Trivandrum:8.5  |\n' +
      '  |                       |* |                 Colombo:6.9     |\n' +
      '  |_____                   --         ______04                 |\n' +
      '  |                                                            |\n' +
      '   ------------------------------------------------------------ ';
};

var getLongitudesBanner = function () {
  return '' +
      '   ------------------------------------------------------------ \n' +
      '  |                  Longitude                                 |\n' +
      '  |            |     |     |     |     |                       |\n' +
      '  |            |     |     |     |     |                       |\n' +
      '  |                  *                         Srinagar:74.8   |\n' +
      '  |                                                            |\n' +
      '  |                    *                       Delhi:77.2      |\n' +
      '  |                              *             Kathmandu:85.2  |\n' +
      '  |                          *                 Varanasi:83.0   |\n' +
      '  |      ---\\                                  Ujjain:75.8     |\n' +
      '  |          \\//      *           *___         Calcutta:88.4   |\n' +
      '  |            \\_/|             _/~   ~                        |\n' +
      '  |               |*          _/               Bombay:72.8     |\n' +
      '  |                \\     *  _/                 Hyderabad:78.5  |\n' +
      '  |                 \\      |                                   |\n' +
      '  |                  \\    *|                   Madras:80.2     |\n' +
      '  |                   \\   /                                    |\n' +
      '  |                    \\*/ /\\                  Trivandrum:77.0 |\n' +
      '  |                       |* |                 Colombo:79.9    |\n' +
      '  |            |     |     --    |     |                       |\n' +
      '  |            |     |           |     |                       |\n' +
      '  |            70          80          90                      |\n' +
      '   ------------------------------------------------------------ ';
};

var getTryMonthsBanner = function () {
  return '\n' +
      '  0(11).Caitra    1( 0).Vaisakha   2( 1).Jyaistha 3( 2).Asadha    \n' +
      '  4( 3).Sravana   5( 4).Bhadrapada 6( 5).Asvina   7( 6).Karttika  \n' +
      '  8( 7).Margasira 9( 8).Pausa     10( 9).Magha   11(10).Phalguna  \n';
};

var displaySettings = function (settings) {
  console.log('\nLocal latitude is set to ' + chalk.red(settings.latitude));
  console.log('Local longitude is set to ' + chalk.red(settings.longitude));
  console.log('System in use: %s\n', chalk.red(settings.system));
};

var prependReturnToFirstQuestion = function () {
  if (!firstQuestionWithReturn) {
    firstQuestionWithReturn = extend(true, {}, firstQuestion);
    firstQuestionWithReturn.choices.unshift('Return');
  }
  return firstQuestionWithReturn;
};

var longitudeLatitudeHandler = function (latitudeOrLongitude) {
  return function (answers) {
    var newValue = answers[latitudeOrLongitude];
    var latLongCapitalized = capitalize(latitudeOrLongitude);
    var setter = 'set' + latLongCapitalized;
    kollavarsham[setter](newValue);
    console.log('\n\t' + latLongCapitalized + ' has been changed to ' + chalk.red.bold(newValue) + '\n');
    askSettingsQuestion();
  };
};

var settingsQuestionHandler = function (answers) {
  switch (answers.settingMenu) {
    case 'Latitude':
      console.log(chalk.green(getLatitudesBanner()));
      inquirer.prompt([latitudeQuestion], longitudeLatitudeHandler('latitude'));
      break;
    case 'Longitude':
      console.log(chalk.green(getLongitudesBanner()));
      inquirer.prompt([longitudeQuestion], longitudeLatitudeHandler('longitude'));
      break;
    case 'Change System':
      var system = kollavarsham.getSettings().system;
      var newSystem = system === 'SuryaSiddhanta' ? 'InPancasiddhantika' : 'SuryaSiddhanta';
      kollavarsham.setSystem(newSystem);
      console.log('\n\tSystem has been changed to \'%s\'\n', chalk.red.bold(newSystem));
      askSettingsQuestion();
      break;
    case 'Go Back':
      showSettingsAndAskFirstQuestion();
      break;
  }
};

var printTryOutput = function (modernDate) {
  console.log(sprintf('==============================================================================='));
  console.log(sprintf('Saka %4s Vikrama %4s | %s %s%3s  | AD%5s %2s %2s %s',
      modernDate.globals.YearSaka, modernDate.globals.YearSaka + 135, modernDate.globals.masa,
      modernDate.globals.paksa, modernDate.globals.tithiDay, modernDate.gregorianDate.getFullYear(),
      modernDate.gregorianDate.getMonth() + 1, modernDate.gregorianDate.getDate(), modernDate.weekdayName));
  console.log(sprintf('==============================================================================='));
};

var printListOutput = function (hinduDate) {
  console.log(sprintf('%4s %2s %2s %s|Saka %4s|V.S. %4s %17s %5s %2s %s',
      hinduDate.gregorianDate.getFullYear(), hinduDate.gregorianDate.getMonth() + 1, hinduDate.gregorianDate.getDate(),
      hinduDate.weekdayName.substr(0, 3), hinduDate.globals.YearSaka, hinduDate.globals.YearVikrama,
      hinduDate.globals.adhimasa + hinduDate.globals.masa, hinduDate.globals.paksa, hinduDate.globals.tithiDay,
      hinduDate.globals.naksatra));
  console.log('===============================================================================');
};

var printVerboseOutput = function (hinduDate, settings) {
  console.log(sprintf('  AD%5s %2s %3s %4s  | JD (at noon)=%8s | Kali-ahargana=%8s ',
      hinduDate.gregorianDate.getFullYear(), hinduDate.gregorianDate.getMonth() + 1, hinduDate.gregorianDate.getDate(),
      hinduDate.weekdayName, hinduDate.julianDay, hinduDate.ahargana));
  console.log(sprintf('==============================================================================='));

  console.log(sprintf('  Pancanga based on %s  at latitude=%3s, longitude=%3s',
      settings.system === 'SuryaSiddhanta' ? 'Suryasiddhanta (AD 1000 ca)\n' : 'older constants in Pancasiddhantika (AD 505)\n',
      settings.latitude, settings.longitude));
  console.log(sprintf('-------------------------------------------------------------------------------'));
  console.log(sprintf(' Indian date (luni-solar year and amanta month)  (*) local sunrise...%2sh %2sm\n',
      hinduDate.globals.sriseh, hinduDate.globals.srisem));
  console.log(sprintf(' year(atita):Saka %4s |Vikrama %4s |Kali %4s | ayanamsa: %2sd %2sm',
      hinduDate.globals.YearSaka, hinduDate.globals.YearVikrama, hinduDate.globals.YearKali, hinduDate.globals.ayanadeg, hinduDate.globals.ayanamin));
  console.log(sprintf('             Jovian(North):%s |Jovian(South):%s',
      chalk.red('** TODO: \'get_Jovian_Year_name\''), chalk.red('** TODO: \'get_Jovian_Year_name_south\'')));  //  &get_Jovian_Year_name($YearKali))); and &get_Jovian_Year_name_south($YearKali)));
  console.log(sprintf(' lunar month, paksa, and tithi(at sunrise): '));
  console.log(sprintf('       %s%s', hinduDate.globals.adhimasa, hinduDate.globals.masa));
  console.log(sprintf(' %s %2s (fraction = 0.%s)', hinduDate.globals.paksa, hinduDate.globals.tithiDay,
      (1 + hinduDate.globals.ftithi).toString().substr(2, 3)));
  console.log(sprintf(' solar month and day: %s %s (samkranti: on %4s %2s %2s at %2sh %2sm',
      hinduDate.globals.sauraMasa, hinduDate.day, hinduDate.globals.samkrantiYear, hinduDate.globals.samkrantiMonth,
      hinduDate.globals.samkrantiDay, hinduDate.globals.samkrantiHour, hinduDate.globals.samkrantiMin));
  console.log(sprintf(' naksatra.... %s  /  karana...%s  /  yoga...%s', hinduDate.globals.naksatra,
      chalk.red('** TODO: \'get_karana_name\''), chalk.red('** TODO: \'get_yoga_name\'')));//  &get_karana_name($tithi))); and &get_yoga_name( $tslong, $tllong )));
  //#   printf ' (Jovian year, karana, and yoga are in the Kyoto-Harvard transliteration system)\n';###20010412
  //#    printf '    NOTICE: if PURNIMANTA K-paksa month names appear a month earlier\n';
  //#    printf '===============================================================================\n'; #20010416
};

var showSettingsAndAskFirstQuestion = function () {
  console.log(chalk.blue.bold('\nSettings:'));
  displaySettings(kollavarsham.getSettings());
  inquirer.prompt([firstQuestion], firstQuestionHandler);
};

var askSettingsQuestion = function () {
  inquirer.prompt([settingsQuestion], settingsQuestionHandler);
};

var displayOutput = function (listOrVerbose, hinduDate, settings) {
  if (listOrVerbose === 'list') {
    printListOutput(hinduDate);
    for (var i = 0; i < 9; i++) {
      gregorianDate.setUTCDate(gregorianDate.getUTCDate() + 1);
      hinduDate = kollavarsham.fromGregorianDate(gregorianDate);
      printListOutput(hinduDate);
    }
  } else {
    printVerboseOutput(hinduDate, settings);
  }
};

var runListOrVerbose = function (listOrVerbose) {
  var operation = capitalize(listOrVerbose);
  console.log(chalk.green('Going to run ' + chalk.red(operation) + chalk.green(' for the date: ')) +
      chalk.red(gregorianDate.toDateString()) + '\n');
  var hinduDate = kollavarsham.fromGregorianDate(gregorianDate);
  //console.log(operation + ' result:\n' + JSON.stringify(hinduDate, null, 2));
  displayOutput(listOrVerbose, hinduDate, kollavarsham.getSettings());
  console.log(chalk.gray('\nSelect (or hit) \'Return\' to go to next date...'));
  inquirer.prompt([prependReturnToFirstQuestion()], firstQuestionHandler);
};

var trySecondSetOfQuestionsHandler = function (answers) {
  if (answers.yearVikrama) {
    answers.yearSaka = answers.yearVikrama - 135;
    delete answers.yearVikrama;
  }
  var modernDate = kollavarsham.toGregorianDateFromSaka(answers);
  printTryOutput(modernDate);
  inquirer.prompt([firstQuestion], firstQuestionHandler);
};

var tryFirstQuestionHandler = function (answers) {
  inquirer.prompt(trySecondSetOfQuestions(answers.sakaVikrama), trySecondSetOfQuestionsHandler);
};

var listVerboseHandler = function (listOrVerbose) {
  lastListOrVerboseOperation = listOrVerbose;
  return function (answers) {
    gregorianDate = new Date(answers.year, answers.month - 1, answers.day);
    runListOrVerbose(listOrVerbose);
  };
};

var firstQuestionHandler = function (answers) {
  switch (answers.topMenu) {
    case 'Return':
      gregorianDate.setUTCDate(gregorianDate.getUTCDate() + 1);
      runListOrVerbose(lastListOrVerboseOperation);
      break;
    case 'Try':
      console.log(chalk.green(getTryMonthsBanner()));
      inquirer.prompt(tryFirstQuestion, tryFirstQuestionHandler);
      break;
    case 'List':
      inquirer.prompt(listVerboseQuestions, listVerboseHandler('list'));
      break;
    case 'Verbose':
      inquirer.prompt(listVerboseQuestions, listVerboseHandler('verbose'));
      break;
    case 'Settings':
      askSettingsQuestion();
      break;
    case 'Exit':
      console.log(chalk.green('\nGood Bye!\n'));
      break;
  }
};

console.log(chalk.green.bold('\nWelcome to pancanga!') + chalk.gray('(node.js version)'));
console.log(chalk.blue('                 [Based on the Perl Version by M. Yano and M.Fushimi]'));
console.log(chalk.gray(getBanner()));

showSettingsAndAskFirstQuestion();
