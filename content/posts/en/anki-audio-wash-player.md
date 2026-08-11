---
title: "I Built a Small Plugin That Connects Anki Listening and AI Reading: Audio Wash Player"
description: "A small Anki plugin that turns the day's cards into repeatable listening material and AI-generated reading practice."
published: "2026-03-23"
locale: "en"
tags:
  - "Open Source Project"
draft: false
pinned: false
translationKey: "anki-audio-wash-player"
---

I recently built a small plugin for my Anki study workflow called **Audio Wash Player**.

Project repository: [https://github.com/evepupil/anki-AudioWash](https://github.com/evepupil/anki-AudioWash)

At first, it was meant to solve one very specific problem: many words and sentences have been "memorized" in Anki, but they are still far from feeling familiar. Listening input and reading in context often feel especially disconnected and incomplete.

Over time, we shaped the plugin around two core directions:

1. **Audio wash listening**
2. **AI-generated reading**

It is no longer just a playback tool. It turns card content into study material that can be listened to repeatedly and expanded into longer reading.

### **Why Build This Plugin?**

Anki reviews are important for language learning, but the real-world experience usually has two gaps:

- First, after a review session ends, there is no low-cost way to keep encountering the same material.
- Second, individual words are fragmented and still one step away from a real context.

For example, you may learn dozens of words and review a batch of old cards today. You recognize them while making or reviewing the cards, but a little later you may not immediately recognize them in audio or when they appear in a real conversation or article.

So the goal is not to replace Anki. It is to fill those two gaps:

- Use an audio loop to keep putting today's material into your ears.
- Use AI-generated text to reorganize today's extracted words into something readable.

### **Feature One: Audio Wash Listening**

The core idea is simple: extract audio from the cards you actually studied and reviewed today, then let the plugin play it in a background loop.

On the implementation side, I added several pieces:

- Query cards studied or reviewed in Anki today.
- Select content by deck or run it across all decks.
- Parse `[sound:...]` tags in cards and extract the audio files.
- Support shuffled playback, looping, and interval control.
- Support a separate playback window and background tray playback.

This lets you keep reviewing in situations such as:

- Commuting
- Walking or exercising
- Doing housework
- Any time it is inconvenient to look at a screen

Compared with opening Anki again and looking through cards one by one, this is lighter and closer to everyday input. It is not meant to turn every moment into a formal study session. It gives you a lower-friction way to keep repeating the material after focused study.

![image.png](/images/notion/anki-ai-audio-wash-player-32c4342e/image-1.png)

We also made card filtering fit common study habits. The plugin lets you choose:

- Only new material learned today
- Only material reviewed today
- A mix of today's new and reviewed material
- In some modes, new cards that have not officially been studied yet for a little preview

This makes the plugin more than an audio player. It can organize input around the day's study task.

![image.png](/images/notion/anki-ai-audio-wash-player-32c4342e/image-2.png)

### **Feature Two: AI-Generated Reading**

The second feature is the part we found especially useful.

When learning vocabulary, the hardest question is often not "Have I seen this word?" but "When is this how the word is used?" A card is concise and informative, but it does not provide enough context. So we built another workflow: **extract words from cards, then give them to AI to generate reading material.**

The plugin first extracts words from the cards you select and organizes them into a list. It then provides a set of AI prompts that you can copy directly from the window. You can choose:

- Output difficulty
- Output format

The main generation directions currently include:

- Dialogue scenes
- Short stories
- Example-sentence lists

The plugin does not call a large model directly inside Anki to write the article. It prepares a Prompt that is suitable for generation. After copying it, you can ask tools such as ChatGPT or Claude to generate text built around those words.

This is useful for:

- Turning a scattered group of words into a complete dialogue
- Organizing the day's vocabulary into a short text for reading comprehension
- Repeating the same words across multiple sentences to build language intuition

![image.png](/images/notion/anki-ai-audio-wash-player-32c4342e/image-3.png)

To me, the most valuable part is that it pushes Anki's "item-based learning" one step further. Instead of only memorizing words, you can put them back into context, read them again, and understand them again.

### **How We Hope People Will Use It**

This plugin fits best in the middle and later parts of a complete learning workflow. It is not meant to replace the main process.

#### Installation

Project page: [evepupil/anki-AudioWash: Audio Wash Player is an Anki plugin that automatically extracts audio from cards studied and reviewed today, then plays it in a background loop](https://github.com/evepupil/anki-AudioWash)

After downloading the project, place it in:

`C:\Users\<your username>\AppData\Roaming\Anki2\addons21\anki-AudioWash`

A natural workflow looks like this:

First complete your normal study and review in Anki. Then:

- Open audio mode and let today's content play in the background.
- Extract today's word list and generate an AI dialogue or short story.
- Read the generated material later as supplementary practice.

This creates a smooth loop:

**Card memory -> repeated audio input -> AI context expansion -> another encounter with the vocabulary**

It does not answer "How do I replace card memorization?" It answers "How do I keep reinforcing the material after reviewing the cards?"

The tool entry point is shown here:

![image.png](/images/notion/anki-ai-audio-wash-player-32c4342e/image-4.png)

### **Conclusion**

For me, **Audio Wash Player** is not a large, all-in-one plugin. It is a focused and practical learning enhancement.

One side connects to the cards already in Anki, and the other connects to input that fits everyday life better: audio wash listening on one side, and AI-generated reading on the other.

If you already use Anki to learn words, phrases, or sentences, this plugin may fit your workflow well. It adds another layer of continuous input beyond card reviews and lets scattered card content gradually grow into more complete language material.
