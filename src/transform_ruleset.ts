import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse, { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import generate from '@babel/generator';
import * as mockjs from 'mockjs';


export function generateSource(ast: t.Node) {
  return generate(ast).code;
}
const ast = parse(`item.meilijie_label_level = (function() {
  return (item.gender=="female" && item.age<24.5 && item.id_city_risk_level['included']([1, 2])) 
  ? 1 
  : (item.gender=="female" && item.age<24.5 && item.id_city_risk_level==3 && item.cnid_is_country_residence==0) 
  ? 1
  : (item.gender=="female" && item.age<24.5 && item.id_city_risk_level==3 && item.cnid_is_country_residence!=0) 
  ? 2 
  : (item.gender=="female" && item.age>=24.5 && item.id_city_risk_level['included']([1, 2])) 
  ? 2 
  : (item.gender=="female" && item.age<24.5 && item.id_city_risk_level==4) 
  ? 3
  : (item.gender=="female" && item.age>=24.5 && item.age<30.5 && item.id_city_risk_level['included']([3, 4])) 
  ? 3 
  : (item.gender=="male") 
  ? 4 
  : (item.gender=="female" && item.age>=30.5 && item.id_city_risk_level['included']([3, 4])) 
  ? 4 
  : 0;
})();`);
interface State {
  result: string | number;
  currentResult: boolean;
  i: number;
  fields: Map<string, any>[];
}

const state: State = {
  result: 1,
  currentResult: true,
  i: -1,
  fields: [],
}

const fieldsVisitor: Visitor<State> = {
  MemberExpression(path, expressResult) {
    console.log(`member expression, ${generateSource(path.node)}`);
    // 设置field 值
    const parent = path.parent;
    const field = path.node.property;
    if (t.isBinaryExpression(parent)) {
      // 处理二元表达式
      const operator = parent.operator;
      const right = parent.right as t.StringLiteral; // 假设 left 为 此次 MemberExpression，且right为字面量
      if (t.isIdentifier(field)) {
        const fieldName = field.name;
        const rightVal = right.value;
        let val: string | number;
        switch (operator) {
          case '<=':
          case '<': {
            val = mockjs.Random.float(0, ~~rightVal);
            console.log('less than', val);
            break;
          }
          case '>':
          case '>=': {
            val = mockjs.Random.float(~~rightVal);
            console.log('great than', val);
            break;
          }
          case '==':
          case '===': {
            val = rightVal;
          }
        }
        console.log(val);
        // console.log(fieldName, rightVal);
        state.fields[state.i].set(fieldName, rightVal);
      }

    }

    if (t.isCallExpression(parent)) {
      //处理调用表达式
      const args = parent.arguments;
      const fCallee = parent.callee as t.MemberExpression;
      let fieldName;
      if (t.isMemberExpression(fCallee.object) && t.isIdentifier(fCallee.object.property)) {
        fieldName = fCallee.object.property.name;
      }
      const fName = (fCallee.property as t.StringLiteral).value;
      const fnames = {
        number: ['between', 'included', 'notIncluded',],
        string: ['included', 'notIncluded', 'notMatch',],
      };
      // console.log(fieldName, fName, args);
      state.fields[state.i].set(fieldName, args);
    }
  },
}

const logicalVisitor: Visitor<State> = {
  /**
   * 
   * @param path 
   * @param state 当前逻辑表达式需要得的计算结果
   */
  LogicalExpression(path, state) {
    console.log(`Logical expression, ${generateSource(path.node)}`, state);
    // think about left right expression result
    const leftExpression = path.node.left;
    const rightExpression = path.node.right;
    const operator = path.node.operator;
    traverse(leftExpression, fieldsVisitor, path.scope, state);
    traverse(rightExpression, fieldsVisitor, path.scope, state);
  },
  CallExpression(path, currentResult) {
    console.log(`call expression, ${generateSource(path.node)}`, currentResult);
  }
}

const conditional: Visitor<State> = {
  ConditionalExpression(path, state) {
    const diveInto = (expression: t.Expression, testResult: boolean) => {
      if (t.isStringLiteral(expression) && expression.value === state.result) {
        const key = `${path.node.start}_${path.node.end}`;
        state.i++;
        state.fields.push(new Map());
        traverse(path.node.test, logicalVisitor, path.scope, { ...state, currentResult: testResult });
      }
      if (t.isNumericLiteral(expression) && expression.value === state.result) {
        const key = `${path.node.start}_${path.node.end}`;
        state.i++;
        state.fields.push(new Map());
        traverse(path.node.test, logicalVisitor, path.scope, { ...state, currentResult: testResult });
      }
    }
    const consequent = path.node.consequent;
    const alt = path.node.alternate;
    diveInto(consequent, true);
    diveInto(alt, false);
  }
}

traverse(ast, conditional, null, state);
console.log(state.fields);