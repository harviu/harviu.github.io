---
layout: page
permalink: /cv/
title: cv
nav: true
nav_order: 5
cv_pdf: CV.pdf
description: Download my CV here.
---
<header class="post-header">
  <h1 class="post-title">
    {{ page.title }}
    {% if page.cv_pdf %}
      <a
        {% if page.cv_pdf contains '://' %}
          href="{{ page.cv_pdf }}"
        {% else %}
          href="{{ page.cv_pdf | prepend: 'assets/pdf/' | relative_url }}"
        {% endif %}
        target="_blank"
        rel="noopener noreferrer"
        class="float-right"
      >
        <i class="fa-solid fa-file-pdf"></i>
      </a>
    {% endif %}
  </h1>
  {% if page.description %}
    <p class="post-description">{{ page.description }}</p>
  {% endif %}
</header>