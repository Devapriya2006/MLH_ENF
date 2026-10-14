---
name: civic-issue-triage
description: Triage a photo of a public civic problem (pothole, garbage, broken streetlight, water leakage, road damage, waterlogging, fallen tree, damaged traffic sign) with a local open-weight vision model. Returns the issue category, a 0-100 severity score, the main risk, the responsible municipal department and a formal complaint text in English, Bengali or Hindi. Use when a user shares a photo of a street or neighbourhood problem, asks how urgent it is, who to report it to, or wants a complaint letter drafted.
license: MIT
compatibility: Requires Node.js 18+ and a running Ollama server (ollama.com) with a vision model pulled, e.g. "ollama pull qwen3-vl:4b-instruct". No API keys or internet access needed at run time.
metadata:
  author: Devapriya Paul Kundu
  version: "1.0"
  project: CivicLens AI
---

# Civic Issue Triage

Turns a photo of a civic problem into a structured, ready-to-file report using an **open-weight
vision-language model that runs locally** (Qwen3-VL via Ollama by default). Photos never leave the machine.

## When to use
- The user shares an image of a pothole, garbage pile, dead streetlight, leaking pipe, damaged road,
  waterlogged street, fallen tree or damaged traffic sign.
- The user asks "how serious is this?", "who do I report this to?" or "write a complaint for this".

Do not use it for photos that are not public-infrastructure or sanitation problems (for example
private property disputes, people, or emergencies). For emergencies tell the user to call local
emergency services first.

## Steps
1. Make sure the image path is known. If the user gave a location or area, keep it for the complaint.
2. Run the script (from this skill's directory):
   ```bash
   node scripts/triage.mjs <path-to-image> --lang en
   ```
   `--lang` accepts `en`, `bn` or `hi`. Optional: `--model <ollama-model>` and `--url <ollama-url>`
   (defaults: `qwen3-vl:4b-instruct`, `http://127.0.0.1:11434`; env `VISION_MODEL`, `OLLAMA_URL`).
3. Read the JSON printed to stdout:
   ```json
   {"is_civic_issue":true,"category":"pothole","confidence":94,"severity":87,
    "risk":"Vehicle accident","title":"Large pothole on main road",
    "description":"...","department":"Road & Transport","model":"qwen3-vl:4b-instruct"}
   ```
4. Present to the user: issue type, severity band (see `references/RUBRIC.md`), risk, the department to
   contact, and the complaint text. Add the user's location to the complaint if they provided it.
5. If `is_civic_issue` is false or `confidence` is below 60, say the result is uncertain and ask for a clearer photo
   or let the user pick the category. Never present low-confidence output as fact.

## Failure handling
- "Cannot reach Ollama": ask the user to install/start Ollama (`ollama serve`).
- "model not installed": ask them to run the `ollama pull ...` command shown in the message.
- If the script cannot run at all, do the assessment yourself from the image using `references/RUBRIC.md`,
  and tell the user it was not produced by the local model.

## Notes
- The script validates the model output against a JSON schema, so the result is always machine-readable.
- Severity is a triage aid, not an official assessment. A human authority makes the final decision.
- Full platform (map, duplicate detection, community verification, admin dashboard): the CivicLens AI repository.
