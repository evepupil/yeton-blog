---
title: "From Prompt to Subagent: A Learning Roadmap for AI Engineering"
description: "A structured path from basic AI usage to reusable, maintainable AI engineering with agents, MCP, memory, workflows, observability, security, and deployment."
published: "2026-05-26"
locale: "en"
tags:
  - "AI"
draft: false
pinned: false
translationKey: "prompt-to-subagent-ai-engineering-roadmap"
---

This roadmap is for anyone who wants to move from basic AI usage toward a reusable, maintainable, and collaborative AI engineering system.

The overall path is:

> _Prompt -> Structured Output -> Tool Calling -> RAG -> Eval -> Agent -> MCP -> Memory/State -> Skill -> Workflow Orchestration -> Subagent -> Observability/Security/Deployment_

---

## **1. Prompt: Express Requirements Clearly**

### **Learning Goal**

Learn how to make AI understand a task accurately.

### **Key Topics**

- Role definition
- Background and context
- Breaking a task into steps
- Output-format constraints
- Example-driven prompting
- Reflection and self-check prompts
- Different prompting approaches for code, tests, documentation, and analysis

### **Practice**

- Ask AI to generate test cases from requirements.
- Ask AI to analyze a problem from logs.
- Ask AI to generate usage examples from API documentation.
- Ask AI to refactor a requirement description that is difficult to understand.

### **Outcome**

You can write task prompts that are clear, stable, and reusable.

---

## **2. Structured Output: Make AI Results Processable by Code**

### **Learning Goal**

Move AI output from free-form language toward structured data.

### **Key Topics**

- JSON output
- JSON Schema
- Type constraints
- Field validation
- Output parsing
- Retry after failure
- Format repair
- Schema tools such as Pydantic and Zod

### **Practice**

- Ask AI to output test cases in a fixed JSON format.
- Extract structured fields from a block of text.
- Ask AI to generate a task plan that conforms to a schema.
- Write a validator that checks whether AI output is valid.

### **Outcome**

AI output can enter a program flow, be read and validated by code, and continue through the next processing step.

---

## **3. Tool Calling: Let AI Call Tools**

### **Learning Goal**

Understand how a model calls external capabilities.

### **Key Topics**

- Function calling
- Tool schema design
- Parameter design
- Tool return-value design
- Handling failed tool calls
- Selecting among multiple tools
- Human confirmation mechanisms
- Blocking dangerous operations

### **Practice**

- Write a weather lookup tool.
- Write a file-reading tool.
- Write a database query tool.
- Write a command-execution tool with permission limits.
- Let AI automatically choose the right tool for a task.

### **Outcome**

AI can call external functions, APIs, file systems, or command lines to complete real work.

---

## **4. RAG: Let AI Use Private Knowledge**

### **Learning Goal**

Let AI answer questions based on your documents, code, and knowledge base.

### **Key Topics**

- Embeddings
- Chunking
- Vector search
- Reranking
- Context assembly
- Source citations
- Knowledge-base updates
- Hallucination control
- Retrieval-quality evaluation

### **Practice**

- Build a local document Q&A system.
- Build a codebase Q&A system.
- Build a product-requirements knowledge base.
- Compare retrieval results with different chunk sizes.
- Add source citations to answers.

### **Outcome**

AI can answer from real material, which is useful for project documentation, internal knowledge bases, and understanding code.

---

## **5. Eval: Decide Whether AI Works Well**

### **Learning Goal**

Build the ability to evaluate AI output quality.

### **Key Topics**

- Test-set design
- Reference-answer design
- Human scoring
- Automatic scoring
- Regression tests
- Tool-call success rate
- Hallucination rate
- Comparing cost, latency, and accuracy

### **Practice**

- Run an A/B test for a prompt.
- Design 30 test questions for a RAG system.
- Measure tool-call success rates.
- Compare the answer quality of different models.
- Create a pre-release evaluation checklist for an AI feature.

### **Outcome**

You can judge whether an AI system is stable, improving, and suitable for release.

---

## **6. Agent: Let AI Execute Tasks Around a Goal**

### **Learning Goal**

Combine models, tools, memory, and an execution loop.

### **Key Topics**

- Planning
- Action
- Observation
- Reflection
- Retry
- Task loops
- Human-in-the-loop
- Multi-step task execution
- Failure recovery

### **Practice**

- A file-organization agent
- A log-analysis agent
- A code-review agent
- An API-testing agent
- A deployment-inspection agent

### **Outcome**

AI can pursue a goal, call tools continuously, and complete a multi-step task.

---

## **7. MCP: Standardize AI Tool Interfaces**

### **Learning Goal**

Package external capabilities as tools and resources that AI can access consistently.

### **Key Topics**

- MCP server
- MCP client
- Tools
- Resources
- Prompts
- Authentication
- Permission control
- Tool-description design
- Return-content design

### **Practice**

- Write a file-system MCP server.
- Write a database-query MCP server.
- Write a project-documentation MCP server.
- Write a testing-platform MCP server.
- Write a personal-knowledge-base MCP server.

### **Outcome**

You can connect business systems, data sources, and local capabilities to an AI workflow.

---

## **8. Memory / State: Manage Context and Long-Term Information**

### **Learning Goal**

Help AI keep understanding the user, project, and task state over time.

### **Key Topics**

- Short-term context
- Long-term memory
- User preferences
- Project memory
- Task state
- Session state
- Memory updates
- Privacy-aware deletion

### **Practice**

- Record a user's commonly used technology stack.
- Record a project's startup command.
- Record solutions to common errors.
- Let an agent remember the progress of its previous task.
- Add interfaces for viewing, updating, and deleting memories.

### **Outcome**

AI can maintain continuity across tasks, reducing the need to repeat the same context.

---

## **9. Skill: Turn Experience into Reusable Capabilities**

### **Learning Goal**

Turn frequently used AI workflows into standardized capabilities.

### **Key Topics**

- Skill trigger conditions
- Skill execution flow
- Input requirements
- Output format
- Script reuse
- Template reuse
- Capturing examples
- Failure handling

### **Practice**

- An API-testing skill
- A code-review skill
- A blog-writing skill
- A presentation-generation skill
- An operations-inspection skill
- A requirements-analysis skill

### **Outcome**

You can turn personal experience into a stable, reusable, and portable AI capability.

---

## **10. Workflow Orchestration: Coordinate Complex Processes**

### **Learning Goal**

Put AI capabilities into a stable workflow.

### **Key Topics**

- Fixed steps
- Conditional branches
- Approval nodes
- Automatic retries
- Error handling
- Collaboration across multiple models
- Human intervention
- Failure rollback

### **Practice**

- Generate test cases -> get human confirmation -> run tests -> output a report
- Analyze requirements -> create a technical plan -> review risks -> split into tasks
- Generate code -> write unit tests -> review the code -> prepare a commit message
- Retrieve documents -> generate an answer -> check citations -> produce the result

### **Outcome**

AI capabilities can enter a more stable business process and support real project delivery.

---

## **11. Subagent: Let Multiple AI Roles Collaborate**

### **Learning Goal**

Split complex work among several specialized roles.

### **Key Topics**

- Main-agent scheduling
- Subagent responsibilities
- Context isolation
- Result aggregation
- Peer review
- Parallel execution
- Role boundaries
- Conflict handling

### **Common Roles**

- Requirements-analysis subagent
- Code-reading subagent
- Implementation subagent
- Testing subagent
- Security-review subagent
- Documentation subagent
- Release-check subagent

### **Practice**

- Have one subagent read the code, one write tests, and one perform a review.
- Have several subagents research different approaches.
- Let the main agent split the task, collect results, and make the final decision.
- Use subagents to complete an end-to-end feature workflow.

### **Outcome**

You can organize multiple AI roles to collaborate on complex tasks.

---

## **12. Observability / Security / Deployment: Make AI Systems Maintainable and Shippable**

### **Learning Goal**

Learn the monitoring, security, and operations skills needed after an AI system goes live.

### **Key Topics**

- Token-cost tracking
- Tracing across calls
- Tool-call logs
- Error logs
- Latency analysis
- User feedback
- Prompt-injection protection
- Tool-injection protection
- Permission isolation
- Sandbox execution
- Audit logs
- Gradual releases

### **Practice**

- Record the input, output, duration, and cost of every AI call.
- Measure tool-call failure rates.
- Add approval steps to dangerous tools.
- Add source checks to RAG answers.
- Build a monitoring dashboard for an AI feature.

### **Outcome**

An AI system has the foundation needed for release, maintenance, troubleshooting, and continuous improvement.

---

# **Recommended Review Order**

For personal study, you can follow this order:

1. Prompt: build strong requirement-expression skills first.
2. Structured Output: make output stable and parseable.
3. Tool Calling: let AI use external capabilities.
4. RAG: let AI use your own material.
5. Eval: establish quality standards.
6. Agent: combine models, tools, and execution loops.
7. MCP: standardize tool and data integration.
8. Memory/State: manage long-term context.
9. Skill: capture reusable workflows.
10. Workflow Orchestration: coordinate complex tasks.
11. Subagent: split work across collaborating roles.
12. Observability/Security/Deployment: move toward real-world operation.

---

# **Summary**

The core upgrade path in this roadmap is:

> _Expression -> Structure -> Tools -> Knowledge -> Evaluation -> Execution -> Connectivity -> Memory -> Reuse -> Orchestration -> Collaboration -> Engineering_
