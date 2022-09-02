class Embed {
  constructor() {
    Object.assign(this, {
      'fields': []
    });
    return this;
  }

  setTitle(title, url = '') {
    this.title = title.toString().substring(0, 256);
    this.url = url;
    return this;
  }

  setAuthor(name, icon = '', url = '') {
    this.author = {
      name: name.toString().substring(0, 256),
      url: url,
      icon_url: icon
    };
    return this;
  }

  setColor(color = Math.floor(Math.random() * 16777216)) {
    this.color = (color[0] === '#') ? parseInt(color.replace('#', ''), 16) : color;
    return this;
  }

  setTimestamp(time = new Date().toISOString()) {
    this.timestamp = time;
    return this;
  }

  setThumbnail(image) {
    this.thumbnail = {
      url: image
    };
    return this;
  }

  setImage(image) {
    this.image = {
      url: image
    };
    return this;
  }

  setFooter(text, url = '') {
    this.footer = {
      icon_url: url,
      text: text
    };
    return this;
  }

  setDescription(value) {
    this.description = value.toString().substring(0, 2048);
    return this;
  }

  addField(title, value, inline = false) {
    this.fields.push({
      name: title.toString().substring(0, 256),
      value: value.toString().substring(0, 1024),
      inline: inline
    });
    return this;
  }
}
module.exports = Embed;