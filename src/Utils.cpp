/********************************************************************************
The MIT License(MIT)

Copyright(c) 2015 Gera Kazakov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files(the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions :

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
********************************************************************************/

#include <windows.h>
#ifndef CTL_CODE
#include <winioctl.h>
#endif
#include <cfgmgr32.h>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>

#include "Utils.h"

std::string GetLastErrorStr(DWORD err)
{
    LPSTR lpMsgBuf;

    if (err == 0)
        err = GetLastError();

    FormatMessage(
        FORMAT_MESSAGE_ALLOCATE_BUFFER |
        FORMAT_MESSAGE_FROM_SYSTEM |
        FORMAT_MESSAGE_IGNORE_INSERTS,
        NULL,
        err,
        MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
        (LPSTR)&lpMsgBuf,
        0, NULL);

    std::string ret(lpMsgBuf);

    LocalFree(lpMsgBuf);

    return std::move(ret);
}

LPWSTR AnsiToUnicode(LPCSTR pszA)
{
    LPWSTR pszW;
    ULONG cCharacters;

    // If input is null then just return the same.
    if (NULL == pszA)
        return NULL;

    // Determine number of wide characters to be allocated for the Unicode string.
    cCharacters = strlen(pszA) + 1;

    pszW = (LPWSTR)LocalAlloc(LPTR, cCharacters * 2);
    if (NULL != pszW)
    {
        // Covert to Unicode.
        if (0 == MultiByteToWideChar(CP_ACP, 0, pszA, cCharacters,
            pszW, cCharacters))
        {
            LocalFree(pszW);
            pszW = NULL;
        }
    }

    return pszW;
}

std::string readFile(const std::string &fileName)
{
    std::ifstream file(fileName);

    if (!file.is_open())
        return std::string();

    std::stringstream sstr;

    while (file >> sstr.rdbuf());

    return sstr.str();
}

bool strToRgb(std::string s, char& r, char& g, char& b)
{
    if (s.size() == 7 && s[0] == '#')
        s = s.substr(1, 6);
    else if (s.size() == 6)
        ;
    else 
        return false;

    int ir, ig, ib;
    if (sscanf_s(s.c_str(), "%2x%2x%2x", &ir, &ig, &ib) != 3)
        return false;

    r = (char)ir;
    g = (char)ig;
    b = (char)ib;

    return true;
}

bool strToRange(const std::string& s, size_t& fr, size_t& to)
{
    size_t p = s.find('-');

    if (p == std::string::npos)
    {
        if (sscanf_s(s.c_str(), "%i", &to) != 1)
            return false;
        fr = to;
    }
    else
    {
        if (sscanf_s(s.c_str(), "%i-%i", &fr, &to) != 2)
            return false;
    }
    return true;
}
