// Navigation and lesson text stay independent of the simulator and retrieval fixtures.
export const AGENT_LESSON_VIEWS = ["understand", "watch", "try", "check"] as const;
export type AgentLessonView = (typeof AGENT_LESSON_VIEWS)[number];
export type AgentChapterId = "agent-basics" | "tool-calling" | "agent-loop" | "state-memory" | "reliability" | "agentic-rag" | "builder-lab";

export interface AgentLesson {
  id: string;
  title: string;
  defaultScenarioId: "eligible-return" | "missing-order" | "used-item" | "expired-return" | "stock-check" | "unknown-order" | "missing-policy" | "tool-timeout" | "invalid-arguments" | "lost-response" | "follow-up" | "memory-preference";
  defaultTaskPreset: "eligibility" | "return-draft" | "stock" | "policy";
  idea: string[];
  watchNarrationStages: string[];
  tryInstructions: string[];
  inspector: { why: string; pitfall: string; math: string; pseudocode: string };
  check: { prompt: string; options: string[]; correctIndex: number; explanation: string };
  sources: { title: string; url: string }[];
}

export interface AgentChapter {
  id: AgentChapterId;
  slug: AgentChapterId;
  title: string;
  headline: string;
  summary: string;
  lessons: AgentLesson[];
}

const AGENTS = { title: "Workflows and agents", url: "https://www.anthropic.com/research/building-effective-agents" };
const CONTRACT = { title: "Where tools run and how the loop works", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works" };
const DEFINITIONS = { title: "Tool names, descriptions, and input schemas", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools" };
const RESULTS = { title: "Matching tool calls, results, and errors", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls" };
const MEMORY = { title: "Conversation state and cross-session memory", url: "https://docs.langchain.com/oss/python/concepts/memory" };
const IDEMPOTENCY = { title: "Making retries safe with idempotent APIs", url: "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/" };
const EVALUATION = { title: "Evaluating an agent's trace and outcome", url: "https://www.anthropic.com/research/demystifying-evals-for-ai-agents" };

export const AGENT_CHAPTERS: AgentChapter[] = [
  {
    id: "agent-basics", slug: "agent-basics", title: "What is an agent?", headline: "A useful next step, chosen from feedback.",
    summary: "Compare a chatbot, a fixed workflow, and an agent without hiding where the decisions come from.",
    lessons: [{
      id: "comparison", title: "Chatbot, workflow, agent", defaultScenarioId: "eligible-return", defaultTaskPreset: "eligibility",
      idea: [
        "A chatbot can answer with text. A workflow follows steps chosen in advance. An agent can choose its next action after seeing what happened, such as checking an order before deciding whether it needs a policy search.",
        "In a real agent, a model makes those choices. Here, choices and short explanations are an authored simulation. The sample tools really look up data, search passages, validate inputs, and change local draft records. Nothing is sent to a real shop.",
      ],
      watchNarrationStages: [
        "Start with the customer's task, not a prewritten answer.",
        "Compare a fixed sequence with a decision that depends on available information.",
        "Execute the chosen sample tool in application code and return its observation.",
        "Choose another action, ask for missing information, or finish with a supported answer.",
      ],
      tryInstructions: [
        "Compare the eligible-return example with a missing order number. Inspect why the next action changes.",
        "Select a decision and its tool result separately. The authored decision is different from the computed observation.",
      ],
      inspector: {
        why: "Feedback matters when the useful next step depends on information the application has not fetched yet. A fixed workflow remains useful when the required sequence is already known.",
        pitfall: "More autonomy is not automatically better. This simulator demonstrates decisions; it does not run an LLM or prove that an actual model will make the same choices.",
        math: "Workflow: the application chooses the path. Agent: a model chooses actions within application-defined capabilities. This lesson substitutes an explicitly authored decision policy.",
        pseudocode: "decision = choose_from(task, visible_context, available_tools)\nobservation = application.execute(decision.tool_call)\nnext_decision = choose_from(task, context + observation, tools)",
      },
      check: {
        prompt: "Which feature makes a system agentic rather than just a fixed workflow?",
        options: ["It displays several connected boxes.", "A model chooses subsequent actions using the information returned so far.", "It calls every available tool in the same order."],
        correctIndex: 1,
        explanation: "The important distinction is who chooses the next action and whether feedback can change it. A graph drawing alone does not make a fixed sequence an agent.",
      },
      sources: [AGENTS, CONTRACT],
    }],
  },
  {
    id: "tool-calling", slug: "tool-calling", title: "Tool calling", headline: "A tool call is a request, not an action.",
    summary: "Follow a structured request through argument validation, application execution, and a matched result.",
    lessons: [{
      id: "contract", title: "The tool contract", defaultScenarioId: "invalid-arguments", defaultTaskPreset: "eligibility",
      idea: [
        "A tool definition tells a model what an operation does and which inputs it accepts. The model can request a call, for example lookup_order with an order number. Application code must validate that request and run the function.",
        "The result returns with an identifier linking it to the original call. A rejected input is an error result, not a successful lookup. The schemas in this lesson describe four fixed teaching tools; the application validates their actual inputs.",
      ],
      watchNarrationStages: [
        "Read the tool's name, purpose, and required input fields.",
        "Inspect the requested tool name, arguments, and call identifier.",
        "Validate the request before the application executes the tool.",
        "Return a result or explicit error matched to that call identifier.",
      ],
      tryInstructions: [
        "Use the invalid-arguments example and inspect the rejected request before a lookup can run.",
        "Compare a valid order input with a missing or incorrectly typed field. Check the request and execution counts.",
      ],
      inspector: {
        why: "The model is a caller of your application interface. Clear tool definitions help it request useful operations, while validation enforces the inputs the application actually accepts.",
        pitfall: "Well-formed JSON can still name an unavailable tool or contain invalid arguments. A displayed schema is not a substitute for application validation, and a call request is not evidence that execution succeeded.",
        math: "One result must refer to its request. A call identifier correlates messages; it does not replace the separate operation key used to deduplicate a retried action.",
        pseudocode: "call = requested_tool_call\nif tool_unavailable(call) or invalid_input(call):\n  return matched_error(call.id)\nreturn matched_result(call.id, execute(call))",
      },
      check: {
        prompt: "The requested order number has the wrong type. What should happen first?",
        options: ["Run the lookup and hope it works.", "Treat the request as proof that an order exists.", "Reject the invalid arguments before executing the lookup."],
        correctIndex: 2,
        explanation: "Validation belongs at the application boundary. The caller receives a matched error so it can correct the request or explain the problem without inventing a successful result.",
      },
      sources: [CONTRACT, DEFINITIONS, RESULTS],
    }],
  },
  {
    id: "agent-loop", slug: "agent-loop", title: "The agent loop", headline: "Ask. Execute. Observe. Choose again.",
    summary: "Trace a complete return task and see when the next step is another call, a question, or an answer.",
    lessons: [{
      id: "loop", title: "Request, execute, observe, decide", defaultScenarioId: "eligible-return", defaultTaskPreset: "return-draft",
      idea: [
        "A useful tool result often answers only part of a task. An order lookup tells us what was bought and when; a policy search tells us which conditions apply. A later call may prepare a return draft.",
        "After every observation, the decision process runs again with the updated context. If a required order number is missing, ask for it. If the task cannot be completed with the available tools or evidence, stop and explain the limit.",
      ],
      watchNarrationStages: [
        "Read the task and inspect which inputs are already known.",
        "Request one permitted tool and let the application return its actual result.",
        "Add that observation to the visible context before choosing another action.",
        "Finish only when the result supports the outcome, or stop to request information or explain a limit.",
      ],
      tryInstructions: [
        "Prepare a draft for the eligible sample order, then try a used item or an expired return window.",
        "Try the missing-order example. A request for clarification is a valid stopping point; an invented order number is not.",
      ],
      inspector: {
        why: "The next decision should depend on observations, not on hidden fixture answers. Keeping requests, executions, and observations separate makes a wrong assumption easier to locate.",
        pitfall: "Text saying ‘draft created’ is not proof. Inspect the returned receipt and the actual sample draft record. Replaying the visual history must not create another draft.",
        math: "A tool-request budget bounds the loop. Retries and invalid requests also consume attempts; asking for input or finishing ends the current run.",
        pseudocode: "while attempts_remain:\n  decision = decide(visible_context)\n  if decision.needs_input or decision.finished: stop\n  context += validate_execute_and_observe(decision.call)",
      },
      check: {
        prompt: "The task needs an order number, but none is in the visible context. What is the useful next step?",
        options: ["Ask the customer for the missing number.", "Read an expected answer from the evaluation fixture.", "Create a draft for an arbitrary sample order."],
        correctIndex: 0,
        explanation: "The agent needs an input before it can request a meaningful lookup. Asking for clarification preserves the task's intent without silently using information it was never given.",
      },
      sources: [AGENTS, CONTRACT, RESULTS, EVALUATION],
    }],
  },
  {
    id: "state-memory", slug: "state-memory", title: "State & memory", headline: "Keep track of what the agent can see.",
    summary: "Separate current context, conversation state, and information explicitly saved for later retrieval.",
    lessons: [
      {
        id: "context", title: "Visible context is the working information", defaultScenarioId: "follow-up", defaultTaskPreset: "eligibility",
        idea: [
          "The decision process can use only the information included in its current context. A tool result stored by the application or displayed in an old transcript does not help unless it is made available to the next decision.",
          "For ‘Can I return it?’, a previous order observation may identify ‘it’. Compare keeping that observation with sending only the latest turn. This simulation makes the included context visible instead of giving the decision policy hidden access to the sample shop.",
        ],
        watchNarrationStages: [
          "Read the earlier order observation in conversation state.",
          "Inspect the context supplied for the follow-up question.",
          "Compare keeping that observation with omitting it from the current turn.",
          "Use the available information, or ask for the order number when it is missing.",
        ],
        tryInstructions: [
          "Use the follow-up example and compare conversation context with current-turn-only context.",
          "Inspect the exact context snapshot before the decision. The visible transcript and supplied context can differ.",
        ],
        inspector: {
          why: "Applications decide which history and observations enter a request. That boundary explains why an agent may lose a reference even while a person can still see it on the screen.",
          pitfall: "Do not secretly look up the fixture's default order when a reference is missing. That makes a context demonstration appear successful by using information outside the supplied context.",
          math: "Stored conversation state is a source for context; it is not automatically the same set of information. Context selection can add or omit observations.",
          pseudocode: "context = current_turn\nif include_conversation:\n  context += earlier_observations\ndecision = decide(context)",
        },
        check: {
          prompt: "An order appears in the on-screen transcript but is omitted from the next context. Can the decision process rely on it?",
          options: ["Yes, because every visible UI element is model memory.", "No. The application must include or retrieve the needed observation.", "Yes, if the diagram keeps the old node highlighted."],
          correctIndex: 1,
          explanation: "A transcript is a user interface. The actual context passed to the next decision determines which observations are available, so those two views must not be confused.",
        },
        sources: [MEMORY, CONTRACT],
      },
      {
        id: "memory", title: "Save explicitly, retrieve explicitly", defaultScenarioId: "memory-preference", defaultTaskPreset: "stock",
        idea: [
          "Conversation state tracks an ongoing exchange. Longer-lived memory stores selected information so another conversation can retrieve it. Saving a preference and including that preference in a later context are two different operations.",
          "This lesson uses a simulated memory store. Watch a preference be saved, start a new simulated conversation, and compare loading it with leaving it in storage. It demonstrates the boundary; it does not create a production database or promise that every future chat remembers you.",
        ],
        watchNarrationStages: [
          "Save the sample preference in the explicitly labeled simulated memory store.",
          "Start a new simulated conversation without the old conversation history.",
          "Choose whether to retrieve the saved preference into the new context.",
          "Inspect the decision's actual context rather than assuming that stored information was used.",
        ],
        tryInstructions: [
          "Use the memory-preference example and compare loading saved memory with leaving it unloaded.",
          "Inspect the save, new-conversation, and context events separately. A saved value is useful only after retrieval.",
        ],
        inspector: {
          why: "Separate storage from retrieval so you can tell whether information was missing, never saved, or simply not included in the request. Production persistence is an application decision.",
          pitfall: "This is a local teaching store, not durable cloud memory. Saving every conversation forever is not required to demonstrate useful recall, and the simulator must not read an unloaded preference behind the scenes.",
          math: "Save → store; retrieve → context; decide → use the visible context. Clearing a conversation and deleting a saved memory are different operations.",
          pseudocode: "memory.save(preference)\ncontext = new_conversation()\nif load_saved_memory:\n  context += memory.read(preference_key)\ndecide(context)",
        },
        check: {
          prompt: "A preference is saved but never retrieved into the new context. What has actually happened?",
          options: ["The new decision automatically knows it because it exists in storage.", "The preference has trained new model weights.", "Storage succeeded, but the new decision has not been given the preference."],
          correctIndex: 2,
          explanation: "Persistent storage and usable context are separate boundaries. The application must retrieve and supply a saved value before a later decision can rely on it.",
        },
        sources: [MEMORY],
      },
    ],
  },
  {
    id: "reliability", slug: "reliability", title: "Reliability", headline: "Make failures visible and retries bounded.",
    summary: "Validate tool requests, stop unproductive loops, and prevent a retry from creating duplicate drafts.",
    lessons: [
      {
        id: "validation", title: "Reject invalid requests before execution", defaultScenarioId: "invalid-arguments", defaultTaskPreset: "eligibility",
        idea: [
          "A tool request may name a disabled operation, omit a required field, or provide the wrong type. Application validation catches these problems before the function reads or changes the sample world.",
          "Return an explicit error linked to the failed request. A later authored decision can repair the arguments or explain the problem. A structurally valid request still needs business checks: a real order may exist while its used item is ineligible for return.",
        ],
        watchNarrationStages: [
          "Inspect the requested tool and its arguments.",
          "Check that the tool is enabled and the required fields have valid types and values.",
          "Return a matched error for invalid input without executing the operation.",
          "Inspect the correction or stopping decision before another attempt is made.",
        ],
        tryInstructions: [
          "Inspect the invalid-arguments scenario, then compare an unknown order with an ineligible real order.",
          "Disconnect a required tool in the builder and confirm that the application does not execute it anyway.",
        ],
        inspector: {
          why: "Input validation and business eligibility answer different questions. Both are application responsibilities, even when a model requested the operation.",
          pitfall: "Do not turn an error into an empty success or execute arbitrary names supplied by a caller. Tool output is data; it cannot redefine the application's enabled tools or validation rules.",
          math: "Request accepted by the schema ≠ operation permitted by the business rule. Invalid requests count toward the attempt budget even when no tool function executes.",
          pseudocode: "require_enabled(call.name)\nrequire_valid_arguments(call.input)\nresult = tool.execute(call.input)\nreturn match_to_call(result, call.id)",
        },
        check: {
          prompt: "The JSON is valid, but the named tool is disconnected. What should the runtime do?",
          options: ["Reject the unavailable operation and return an explicit failure.", "Run it because JSON parsing succeeded.", "Treat the tool's name as executable application code."],
          correctIndex: 0,
          explanation: "Parsing JSON validates its syntax, not the caller's available capabilities. The runtime must enforce the enabled tool set before executing any requested operation.",
        },
        sources: [DEFINITIONS, RESULTS],
      },
      {
        id: "retries", title: "Retry a problem, not an endless loop", defaultScenarioId: "tool-timeout", defaultTaskPreset: "return-draft",
        idea: [
          "A temporary failure may succeed on another attempt. A missing order number needs clarification instead. Retrying every failure forever makes the system harder to understand and cannot create missing information.",
          "Set both a retry allowance and an overall tool-attempt limit. In this simulator, retries and invalid requests also spend attempts. Watch the error return to the decision process, then compare recovery with a clear stop when the available budget is exhausted.",
        ],
        watchNarrationStages: [
          "Receive an explicit tool failure rather than a successful observation.",
          "Check whether another attempt is allowed by both retry and overall limits.",
          "Retry with the required information, or stop instead of repeating indefinitely.",
          "Inspect actual attempts, executions, errors, and the final stopping reason.",
        ],
        tryInstructions: [
          "Use the tool-timeout example and compare zero retries with one retry.",
          "Lower the overall attempt limit. Check whether a recovered early call leaves enough attempts to finish the task.",
        ],
        inspector: {
          why: "Separate per-operation retries from a run-wide budget. A successful retry can still consume the attempts needed by a later operation, so its effect must remain visible in the trace.",
          pitfall: "A timeout does not prove that an operation had no effect. The idempotency lesson covers that uncertainty. These offline counts are not measured provider latency, token usage, monetary cost, or model confidence.",
          math: "Every request attempt, including a rejected or retried request, consumes the run's tool-attempt budget. The per-operation retry allowance is an additional bound.",
          pseudocode: "if retry_allowed and attempts_remaining:\n  retry_same_operation()\nelse:\n  stop_with_explicit_reason()",
        },
        check: {
          prompt: "A retry is available, but the run has exhausted its overall attempt limit. What happens next?",
          options: ["Ignore the overall limit until the task succeeds.", "Stop and explain that the attempt budget is exhausted.", "Report success because a retry could have worked."],
          correctIndex: 1,
          explanation: "Both bounds apply. A remaining retry allowance does not override the run-wide limit, and stopping should not be mislabeled as successful task completion.",
        },
        sources: [AGENTS, RESULTS, IDEMPOTENCY],
      },
      {
        id: "idempotency", title: "One intended action, even after a retry", defaultScenarioId: "lost-response", defaultTaskPreset: "return-draft",
        idea: [
          "A tool can create a return draft, then lose its response. The caller sees a timeout and may retry even though the first attempt already changed the sample shop.",
          "An operation key identifies the same intended action across attempts. Reusing that key with the same inputs returns the existing draft instead of creating another. A call identifier only matches a request to its result; it is not the same thing as the operation key.",
        ],
        watchNarrationStages: [
          "Create the sample draft, then simulate losing the response after the change.",
          "Observe the failure from the caller's perspective and request a retry.",
          "Keep the operation key stable across attempts so the existing draft can be returned.",
          "Count actual draft records and compare the receipt with the intended outcome.",
        ],
        tryInstructions: [
          "Use the lost-response example and inspect the world snapshot before the retry.",
          "Compare reusing the operation key with treating the retry as a new operation. Count draft records, not success messages.",
        ],
        inspector: {
          why: "A response failure and an operation failure are different events. Stable operation identity lets the application recognize a repeated request after it has already committed an effect.",
          pitfall: "The application must reject reuse of the same operation key with different arguments. Starting a genuinely new action needs a new key; silently reusing an old result would hide changed intent.",
          math: "Same operation key + same inputs → same draft receipt. Same operation key + different inputs → conflict. A retried call can have a new call ID while retaining its operation key.",
          pseudocode: "if operation_key in receipts:\n  require_same_arguments(operation_key, input)\n  return receipts[operation_key]\nreturn create_and_record_draft(operation_key, input)",
        },
        check: {
          prompt: "A draft was created, but its response was lost. Which retry can avoid a duplicate effect?",
          options: ["Retry with a new operation key every time.", "Assume the timeout guarantees that nothing was created.", "Reuse the original operation key and the same action arguments."],
          correctIndex: 2,
          explanation: "The application can recognize that operation and return its recorded receipt. The resulting draft store, rather than a message saying ‘success’, reveals whether a duplicate was created.",
        },
        sources: [IDEMPOTENCY, RESULTS, EVALUATION],
      },
    ],
  },
  {
    id: "agentic-rag", slug: "agentic-rag", title: "Agentic RAG", headline: "Search when the task needs evidence.",
    summary: "Make retrieval a tool choice, inspect actual returned passages, and keep unsupported claims out of the answer.",
    lessons: [{
      id: "retrieval", title: "A policy search is another observation", defaultScenarioId: "eligible-return", defaultTaskPreset: "policy",
      idea: [
        "An order lookup can tell us when an item arrived. It cannot establish a policy that was never returned. An agent can request a policy search when the task needs knowledge from documents, then continue using the retrieved evidence.",
        "Here, search_policies uses the existing offline RAG experiment's supported examples and real retrieval calculations. Agent choices and answer explanations remain authored simulations. A returned passage can support a citation; the search request or a high ranking alone cannot prove the answer.",
      ],
      watchNarrationStages: [
        "Identify which part of the task needs document evidence.",
        "Request the enabled policy-search tool for a supported policy example.",
        "Return actual source passages and identifiers as a tool observation.",
        "Answer only with available support, or explain that the needed policy evidence is missing.",
      ],
      tryInstructions: [
        "Inspect a supported return-policy search, then choose the missing-policy example.",
        "Open the cited source text. The answer cannot use an expected answer or a passage that was never returned.",
      ],
      inspector: {
        why: "Retrieval supplies observations to the loop. Separating the search decision from the returned evidence makes it possible to locate a missing fact instead of trusting a polished final sentence.",
        pitfall: "A citation can refer to a related passage without supporting the claim. Tool results are evidence, not new application instructions. This teaching adapter supports curated search examples rather than arbitrary live questions.",
        math: "A supported claim must trace to evidence in the returned observations. Expected outcomes are evaluator inputs; they must not be used to select tools, rank passages, or invent missing facts.",
        pseudocode: "if task_needs_document_evidence:\n  observation = search_policies(supported_topic)\nif evidence_supports_answer(observation):\n  answer_with_source_ids()\nelse: explain_missing_evidence()",
      },
      check: {
        prompt: "The retrieved documents never state a student-discount policy. What should the agent do?",
        options: ["Explain that the returned evidence does not establish the policy.", "Invent a discount because the search tool completed successfully.", "Treat a related passage's rank as proof of a discount."],
        correctIndex: 0,
        explanation: "Successful retrieval is not the same as finding an answering source. The agent must identify the evidence gap rather than turn a completed tool call into a fabricated policy claim.",
      },
      sources: [AGENTS, CONTRACT, EVALUATION],
    }],
  },
  {
    id: "builder-lab", slug: "builder-lab", title: "Agent Builder", headline: "Choose the capabilities. Inspect the consequences.",
    summary: "Configure one simulated agent with built-in tools, guided tasks, context, and explicit execution limits.",
    lessons: [{
      id: "builder", title: "Configure and test one agent", defaultScenarioId: "eligible-return", defaultTaskPreset: "return-draft",
      idea: [
        "Connect the capabilities that one agent is allowed to request, choose a sample task, and set its limits. A connection makes a tool available; it does not dictate the order in which the agent must call tools.",
        "Run the authored simulation and inspect each requested action, application result, and sample-world change. Check the outcome as well as the trace. The builder uses guided task presets and four built-in tools; it does not interpret arbitrary prompts or run uploaded code.",
      ],
      watchNarrationStages: [
        "Connect the built-in tools needed by the selected sample task.",
        "Set the visible context, overall attempt limit, and retry allowance.",
        "Run the authored decision simulation and follow actual tool results.",
        "Inspect the final evidence and sample records before judging whether the task succeeded.",
      ],
      tryInstructions: [
        "Prepare a return draft with order lookup, policy search, and draft creation connected; then disconnect one required capability.",
        "Compare the eligible, used-item, and expired-return examples. Restarting a run resets the sample world while preserving your setup.",
      ],
      inspector: {
        why: "Changing one capability or limit at a time reveals what the task depends on. The application still enforces enabled tools and valid inputs after a decision requests an action.",
        pitfall: "A connected canvas is not proof of task success. Confirm the returned evidence and actual draft record. A disabled tool must remain unavailable even if the authored policy requests it.",
        math: "Inspect actual requests, executions, retries, validation failures, and effects. Different valid paths can reach the same outcome; a fixed sequence is not the definition of correctness.",
        pseudocode: "config = task + enabled_tools + context_mode + limits\nrun = simulate(config, fresh_sample_world)\ninspect(run.events)\nevaluate(run.final_world, run.returned_evidence)",
      },
      check: {
        prompt: "The final text says a return draft exists. What is the decisive outcome check?",
        options: ["Every tool node is connected to the canvas.", "The sample draft store contains the correct draft and its receipt matches the result.", "The animation reached the final node without pausing."],
        correctIndex: 1,
        explanation: "A success message is only a claim. The requested draft must exist in the resulting sample world, with the right order and a matching receipt, before the task can be judged complete.",
      },
      sources: [AGENTS, DEFINITIONS, EVALUATION],
    }],
  },
];

export function getAgentChapter(slug: string): AgentChapter | undefined {
  return AGENT_CHAPTERS.find((chapter) => chapter.slug === slug);
}

export function getAgentLesson(chapter: AgentChapter, id?: string): AgentLesson {
  return chapter.lessons.find((lesson) => lesson.id === id) ?? chapter.lessons[0];
}
