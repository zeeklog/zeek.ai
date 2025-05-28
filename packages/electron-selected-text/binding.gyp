{
  "targets": [
    {
      "target_name": "selectedText",
      "sources": [ "selectedText.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "conditions": [
        ['OS=="win"', {
          "libraries": [ "uiautomationcore.lib" ]
        }],
        ['OS=="mac"', {
          "libraries": [
            "-framework ApplicationServices",
            "-framework CoreFoundation"
          ],
          "xcode_settings": {
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
          }
        }],
        ['OS=="linux"', {
          "libraries": [ "-lX11" ]
        }]
      ]
    }
  ]
}
