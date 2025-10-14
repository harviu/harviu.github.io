---
layout: page
permalink: /cv/
title: cv
nav: true
nav_order: 5
cv_pdf: CV.pdf
description: Download my CV here.
---

{% if page.cv_pdf %}
  <a
    {% if page.cv_pdf contains '://' %}
      href="{{ page.cv_pdf }}"
    {% else %}
      href="{{ page.cv_pdf | prepend: 'assets/pdf/' | relative_url }}"
    {% endif %}
    target="_blank"
    rel="noopener noreferrer"
    class="btn btn-outline-primary d-block mx-auto"
  >
    <i class="fa-solid fa-file-pdf"></i> Download CV
  </a>
{% endif %}