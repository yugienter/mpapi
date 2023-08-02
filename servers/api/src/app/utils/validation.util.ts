import { Logger } from '@nestjs/common';
import Ajv, { AnySchemaObject } from 'ajv';
import addFormats from 'ajv-formats';
import _ from 'lodash';
import moment, { Moment } from 'moment';
import { Blob } from 'node:buffer';
import { sprintf } from 'sprintf-js';

import { ValidationException } from '@/app/exceptions/errors/validation.exception';
import { I18nProvider } from '@/app/providers/i18n.provider';

/**
 * ajvをベースにしたカスタムvalidation定義やvalidation周りの便利関数
 */
export class ValidationUtil {
  private static _ajv: Ajv;
  static comparisons = {
    '<': function (startTime: Moment, endTime: Moment) {
      return startTime.isAfter(endTime);
    },
    '<=': function (startTime: Moment, endTime: Moment) {
      return startTime.isSameOrAfter(endTime);
    },
    '>': function (startTime: Moment, endTime: Moment) {
      return startTime.isBefore(endTime);
    },
    '>=': function (startTime: Moment, endTime: Moment) {
      return startTime.isSameOrBefore(endTime);
    },
  };
  private static get ajv() {
    // 使用法
    // 開始と終了のスキーマがある場合に、開始スキーマに、終了スキーマを$dataとして渡す
    // また、比較演算子を指定する必要がある
    //
    // ex: 開始スキーマ(from_datetime), 終了スキーマ(to_datetime)
    // term_from: {
    //   type: 'string', format: 'date',
    //   datetimeComparison: { operator: '<', $data: '1/term_to' },
    // },
    // term_to: { type: 'string', format: 'date' },
    const datetimeComparisonValidationFunc = function validate(schema, data, parentSchema: AnySchemaObject) {
      const fromDatetimeMoment = moment(schema);
      const toDatetimeMoment = moment(data);
      _.set(datetimeComparisonValidationFunc, 'errors', [
        {
          keyword: 'datetimeComparison',
          message: 'invalid datetime.',
          params: { fromDatetimeMoment, toDatetimeMoment },
        },
      ]);
      return ValidationUtil.comparisons[parentSchema.datetimeComparison.operator](fromDatetimeMoment, toDatetimeMoment);
    };

    // 使用法
    // 比較したい時刻と比較演算子を指定する必要がある

    // ex: 検証したい時刻が 午前6時よりも後か？
    //   from_date: {
    //     timeComparison: { operator: '>=', targetHhMm: '06:00' },
    //   },
    // ex: 検証したい時刻が 午前11時よりも前か？
    //   to_date: {
    //     timeComparison: { operator: '<=', targetHhMm: '23:00' },
    //   },
    const timeComparisonValidationFunc = function validate(schema, data, parentSchema: AnySchemaObject) {
      const defaultYear = 2000;
      const defaultMonth = 0;
      const defaultDay = 1;

      // 比較対象の年月日をデフォルトに設定し、時刻の比較のみを行うようにする
      const sourceTimeMoment = moment(parentSchema.timeComparison.targetHhMm, 'HH:mm').set({
        year: defaultYear,
        month: defaultMonth,
        date: defaultDay,
      });
      const targetTimeMoment = moment(data).set({ year: defaultYear, month: defaultMonth, date: defaultDay });
      _.set(timeComparisonValidationFunc, 'errors', [
        { keyword: 'timeComparison', message: 'invalid time.', params: { sourceTimeMoment, targetTimeMoment } },
      ]);
      return ValidationUtil.comparisons[parentSchema.timeComparison.operator](sourceTimeMoment, targetTimeMoment);
    };

    // 使用法
    // 開始と終了のスキーマがある場合に、開始スキーマに、終了スキーマを$dataとして渡す
    // 指定可能な期間単位は、years, months, days, hours
    // ex: 開始スキーマと終了スキーマの年数の差が、指定した年数以下か？(例は1年)
    // from_date: {
    //   type: ['string'], format: 'date-time',
    //   timeRange: { timeRange: 1, periodUnit: 'years', $data: '1/to_date' },
    // },
    const timeRangeValidationFunc = function validate(schema, data, parentSchema: AnySchemaObject) {
      const fromDatetimeMoment = moment(data);
      const toDatetimeMoment = moment(schema);
      const timeRange = parentSchema.timeRange.timeRange;
      const periodUnit = parentSchema.timeRange.periodUnit;
      const comparisons = {
        years: function (fromDatetimeMoment: Moment, toDatetimeMoment: Moment) {
          return toDatetimeMoment.diff(fromDatetimeMoment, 'years') <= timeRange;
        },
        months: function (fromDatetimeMoment: Moment, toDatetimeMoment: Moment) {
          return toDatetimeMoment.diff(fromDatetimeMoment, 'months') <= timeRange;
        },
        days: function (fromDatetimeMoment: Moment, toDatetimeMoment: Moment) {
          return toDatetimeMoment.diff(fromDatetimeMoment, 'days') <= timeRange;
        },
        hours: function (fromDatetimeMoment: Moment, toDatetimeMoment: Moment) {
          return toDatetimeMoment.diff(fromDatetimeMoment, 'hours') <= timeRange;
        },
      };
      _.set(timeRangeValidationFunc, 'errors', [
        { keyword: 'timeRangeComparison', message: 'invalid time range.', params: { timeRange, periodUnit } },
      ]);
      const isCorrectTimeRange = comparisons[periodUnit](fromDatetimeMoment, toDatetimeMoment);
      const isCorrectTimeOrder = fromDatetimeMoment.isBefore(toDatetimeMoment);
      return isCorrectTimeRange && isCorrectTimeOrder;
    };

    if (!ValidationUtil._ajv) {
      ValidationUtil._ajv = new Ajv({
        allErrors: true,
        $data: true,
        useDefaults: true,
      });
      ValidationUtil._ajv.addFormat('single-bytes', {
        type: 'string',
        validate: (x) => _.isString(x) && new Blob([x]).size == x.length,
      });
      ValidationUtil._ajv.addFormat('katakana', {
        type: 'string',
        validate: (x) => _.isString(x) && !!x.match(/^[ァ-ヴー]+$/),
      });
      ValidationUtil._ajv.addFormat('hiragana', {
        type: 'string',
        validate: (x) => _.isString(x) && !!x.match(/^[ぁ-んー]+$/),
      });
      ValidationUtil._ajv.addFormat('hiragana-with-space', {
        type: 'string',
        // 半角・全角スペースを含む
        // eslint-disable-next-line no-irregular-whitespace
        validate: (x) => _.isString(x) && !!x.match(/^[ぁ-んー　 ]+$/),
      });
      ValidationUtil._ajv.addKeyword({
        keyword: 'datetimeComparison',
        type: 'string',
        $data: true,
        validate: datetimeComparisonValidationFunc,
        errors: true,
      });
      ValidationUtil._ajv.addKeyword({
        keyword: 'timeComparison',
        type: 'string',
        validate: timeComparisonValidationFunc,
        errors: true,
      });
      ValidationUtil._ajv.addKeyword({
        keyword: 'timeRange',
        type: 'string',
        $data: true,
        validate: timeRangeValidationFunc,
        errors: true,
      });
      addFormats(ValidationUtil._ajv);
    }
    return ValidationUtil._ajv;
  }

  private static readonly logger = new Logger(ValidationUtil.name);

  static async validate(data, validationSchema) {
    const validate = ValidationUtil.ajv.compile(validationSchema);
    const validationResult = await validate(data);
    if (!validationResult) {
      throw new ValidationException('Unprocessable Entity', validate.errors);
    }
    // 上書き
    _.assign(data, this.convertTypesOfSpecificProperties(data, validationSchema));
  }

  /* スキーマのデータをもとに、特定のプロパティの型を変換した状態で返す */
  static convertTypesOfSpecificProperties(data, schemaElement: { type?; enum?; properties?; items?; format? }) {
    if (_.isNil(schemaElement) || _.isNil(data)) {
      return data;
    }

    if (_.includes(schemaElement.type, 'object') && _.isObject(data)) {
      return _.mapValues(_.get(schemaElement, 'properties'), (definedProperty, propertyName) => {
        return this.convertTypesOfSpecificProperties(_.get(data, propertyName), definedProperty);
      });
    }

    if (_.includes(schemaElement.type, 'array') && _.isArray(data) && !_.isNil(_.get(schemaElement, 'items'))) {
      return _.map(data, (item) => {
        // 生の日付の連続の場合。たとえば ['2020-01-01T00:00:00Z', '2020-01-02T00:00:00Z']
        if (_.includes(schemaElement.items.format, 'date-time') && _.isString(item)) {
          return moment(item).toDate();
        }
        // オブジェクトの列の場合には変換する。
        return this.convertTypesOfSpecificProperties(item, schemaElement.items);
      });
    }

    if (_.includes(schemaElement.format, 'date-time') && _.isString(data)) {
      // date-timeフォーマットの場合は変換する
      return moment(data).toDate();
    }

    return data;
  }

  private static translateOrDefault(i18n: I18nProvider, key, lang): string {
    const paramKey = `validation.${key}`;
    const translated = i18n.translate(paramKey, { lang });
    return translated == paramKey ? key : translated;
  }

  static getTranslatedMessage(i18n: I18nProvider, lang, info: { param: string; type: string; values }) {
    const paramName = ValidationUtil.translateOrDefault(
      i18n,
      info.param != '' ? info.param : info.values?.missingProperty,
      lang,
    );
    const messageKey = `messages.${info.type}`;
    const placeholder = ValidationUtil.translateOrDefault(i18n, messageKey, lang);
    if (placeholder == messageKey) {
      ValidationUtil.logger.verbose(
        `message not found for validation: ${messageKey} w/ param=${info.param} (validation.json)`,
      );
      return ValidationUtil.translateOrDefault(i18n, 'messages._default', lang);
    }
    const pairs = _.chain(info.values)
      .toPairs()
      .map((pair) => {
        const result = ValidationUtil.translateOrDefault(i18n, pair[1], lang);
        return [pair[0], result];
      })
      .value();

    const data = {
      ..._.fromPairs(pairs),
      _: paramName,
    };
    try {
      return sprintf(placeholder, data);
    } catch (e) {
      ValidationUtil.logger.warn(e);
    }
    return null;
  }
}
