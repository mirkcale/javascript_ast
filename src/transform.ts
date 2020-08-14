import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse, { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { generateSource } from './transform_ruleset';

const sourcePath = './quality-control-content.controller.js';
const sourcecode = fs.readFileSync(path.resolve(__dirname, sourcePath)).toString();
const ast = parse(sourcecode, { sourceType: 'module' });

const map = new Map();

/**
 * 找到需要处理的函数的函数名
 */
const f2c: Visitor<Map<string, string>> = {
  Program(path, map) {
    const funArr = path.node.body
      .filter((statement): statement is (t.FunctionDeclaration | t.ExportNamedDeclaration) => t.isFunction(statement) || t.isExportNamedDeclaration(statement))
      .map(u => u);
    ;
    const memArr = path.node.body
      .filter((statement) => t.isAssignmentExpression(statement))
  },
}

const myVisitor: Visitor<Map<string, string>> = {
  FunctionDeclaration(path, map) {
    generateSource(path.node);
    const name = path.node.id.name;
    console.log(map.size);
  },
  AssignmentExpression(path, map) {
    const left = path.node.left;
    console.log(map);
    if (t.isMemberExpression(left)
      && t.isIdentifier(left.property)
      && left.property.name === '$inject'
      && t.isIdentifier(left.object)
      && map.has(left.object.name)
    ) {
      path.remove();
    }
  }

}

// traverse<Map<string, string>>(ast, myVisitor, null, map);
traverse<Map<string, string>>(ast, f2c, null, map);

