'use strict';

let ioInstance = null;

function set_io(io) {
  ioInstance = io;
}

function get_io() {
  return ioInstance;
}

module.exports = { set_io, get_io };
