class Embed {
  constructor() {
    Object.assign(this, {
      'fields': []
    });
    return this;
  }


  title(title, url = '') {
    this.title = title.toString().substring(0, 256);
    this.url = url;
    return this;
  }

  author(name, icon = '', url = '') {
    this.author = {
      'name': name.toString().substring(0, 256),
      'url': url,
      'icon_url': icon
    };
    return this;
  }

  color(color = 9720750) {
    this.color = (color[0] === '#') ? parseInt(color.replace('#', ''), 16) : color;
    return this;
  }

  timestamp(time = new Date()) {
    this.timestamp = time;
    return this;
  }

  thumbnail(image) {
    this.thumbnail = {
      'url': image
    };
    return this;
  }

  image(image) {
    this.image = {
      'url': image
    };
    return this;
  }

  footer(text, url = '') {
    this.footer = {
      'icon_url': url,
      'text': text
    };
    return this;
  }

  description(value) {
    this.description = value.toString().substring(0, 2048);
    return this;
  }

  addField(title, value, inline = false) {
    this.fields.push({
      'name': title.toString().substring(0, 256),
      'value': value.toString().substring(0, 1024),
      'inline': inline
    });
    return this;
  }
}
module.exports = Embed;