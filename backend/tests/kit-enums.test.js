import test from "node:test";
import assert from "node:assert/strict";
import Kit from "../models/Kit.js";
import { AppendixASchema } from "../zod/appendixKit.schema.js";
import {
  KIT_QUESTION_CATEGORIES,
  KIT_REQUIREMENT_KINDS,
  KIT_REQUIREMENT_PRIORITIES,
} from "../constants/kitEnums.js";

test("kit persistence and Appendix validation share canonical enum values", () => {
  const requirementSchema = Kit.schema.path("role.requirements").schema;
  const questionSchema = Kit.schema.path("questions").schema;

  assert.deepEqual(requirementSchema.path("kind").options.enum, KIT_REQUIREMENT_KINDS);
  assert.deepEqual(requirementSchema.path("priority").options.enum, KIT_REQUIREMENT_PRIORITIES);
  assert.deepEqual(questionSchema.path("category").options.enum, KIT_QUESTION_CATEGORIES);

  const appendixShape = AppendixASchema.shape;
  assert.deepEqual(appendixShape.role.shape.requirements.element.shape.kind.options, KIT_REQUIREMENT_KINDS);
  assert.deepEqual(appendixShape.role.shape.requirements.element.shape.priority.options, KIT_REQUIREMENT_PRIORITIES);
  assert.deepEqual(appendixShape.questions.element.shape.category.options, KIT_QUESTION_CATEGORIES);
});
