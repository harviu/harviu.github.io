---
layout: page
title: Efficient Machine Learning Model Query
description: project on efficient machine learning model query for scientific visualization
img: assets/img/publication_preview/li2024efficient.png
importance: 2
category: research
related_publications: true
---

We design methods that let you query compact ML models—Gaussian Processes (GPs) and Implicit Neural Representations (INRs)—without brute force. By using uncertainty and tight bounds, we skip work safely and return what you care about (iso-surfaces, statistics, parameter effects) much faster.

## Why this matters
Modern simulations create massive data. We compress them into learned models to save space—but then waste compute on naïve queries (dense sampling, full parameter sweeps, heavy Monte Carlo).  
**This project improves the *query* side**, making interrogation of ML models efficient, interactive, and reliable. {% cite li2024efficient li2024improving chen2025explorable%}


