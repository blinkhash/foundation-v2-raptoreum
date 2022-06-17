{
    "targets": [
        {
            "target_name": "hashing",
            "sources": [
                "hashing.cc",
                "algorithms/ghostrider/ghostrider.c",
                "algorithms/ghostrider/utils/aes_helper.c",
                "algorithms/ghostrider/utils/extra.c",
                "algorithms/ghostrider/utils/gost_streebog.c",
                "algorithms/ghostrider/utils/lyra2.c",
                "algorithms/ghostrider/utils/sph_blake.c",
                "algorithms/ghostrider/utils/sph_bmw.c",
                "algorithms/ghostrider/utils/sph_cubehash.c",
                "algorithms/ghostrider/utils/sph_echo.c",
                "algorithms/ghostrider/utils/sph_fugue.c",
                "algorithms/ghostrider/utils/sph_groestl.c",
                "algorithms/ghostrider/utils/sph_hamsi.c",
                "algorithms/ghostrider/utils/sph_haval.c",
                "algorithms/ghostrider/utils/sph_jh.c",
                "algorithms/ghostrider/utils/sph_keccak.c",
                "algorithms/ghostrider/utils/sph_luffa.c",
                "algorithms/ghostrider/utils/sph_shabal.c",
                "algorithms/ghostrider/utils/sph_shavite.c",
                "algorithms/ghostrider/utils/sph_simd.c",
                "algorithms/ghostrider/utils/sph_skein.c",
                "algorithms/ghostrider/utils/sph_tiger.c",
                "algorithms/ghostrider/utils/sph_whirlpool.c",
                "algorithms/ghostrider/utils/sponge.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight_dark_lite.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight_dark.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight_fast.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight_lite.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight_soft_shell.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight_turtle_lite.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight_turtle.c",
                "algorithms/ghostrider/utils/cryptonote/cryptonight.c",
                "algorithms/ghostrider/utils/crypto/aesb.c",
                "algorithms/ghostrider/utils/crypto/c_blake256.c",
                "algorithms/ghostrider/utils/crypto/c_groestl.c",
                "algorithms/ghostrider/utils/crypto/c_jh.c",
                "algorithms/ghostrider/utils/crypto/c_keccak.c",
                "algorithms/ghostrider/utils/crypto/c_skein.c",
                "algorithms/ghostrider/utils/crypto/hash.c",
                "algorithms/ghostrider/utils/crypto/oaes_lib.c",
                "algorithms/sha256d/sha256d.c",
                "algorithms/sha256d/utils/sph_sha2.c",
            ],
            "include_dirs": [
                ".",
                "<!(node -e \"require('nan')\")",
            ],
            "cflags_cc": [
                "-std=c++0x",
                "-fPIC",
                "-fexceptions"
            ],
            "defines": [
                "HAVE_DECL_STRNLEN=1",
                "HAVE_BYTESWAP_H=1"
            ],
            "link_settings": {
                "libraries": [
                    "-Wl,-rpath,./build/Release/",
                ]
            },
            'conditions': [
                ['OS=="mac"', {
                    'xcode_settings': {
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
                    }
                }]
            ]
        }
    ]
}
