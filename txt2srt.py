#!/usr/bin/env python
# -*- coding:utf-8 -*-
from tkinter import filedialog
from tkinter import ttk

import sys
import os
import tkinter as tk
import tkinter.font as tkFont
import tkinter.messagebox


def get_txt_path():
    file_path = filedialog.askopenfilename()
    if file_path == '':
        return
    if file_path.split('/')[len(file_path.split('/')) - 1].split('.')[1] != 'txt':
        tkinter.messagebox.showinfo('警告', '你必須輸入txt檔喔！')
        return
    path_label.configure(text=file_path)


def generate_srt():
    fileName = path_label.cget('text')

    try:
        txtFile = open(fileName,'r')
    except:
        tkinter.messagebox.showinfo('警告','你沒有輸入任何文字檔喔！')
        return

    text = txtFile.read()
    txtFile.close()

    sentences = text.split('\n')

    outputName = fileName.split('/')[len(fileName.split('/')) - 1].split('.')
    outputFile = open(os.path.dirname(os.path.abspath(__file__)) + '/' + outputName[0]+'.srt', 'w+')

    lineNum = 1
    hr = 0
    min = 0
    sec = 0

    try:
        interval = int(interval_entry.get())
    except:
        interval = 5

    for sentence in sentences:
        msg = str(lineNum)
        msg += '\n'
        if(hr < 10):
            msg += '0' + str(hr) + ':'
        else:
            msg += str(hr) + ':'
        if(min < 10):
            msg += '0' + str(min) + ':'
        else:
            msg += str(min) + ':'
        if(sec < 10):
            msg += '0' + str(sec) + ',000 --> '
        else:
            msg += str(sec) +  ',000 --> '

        sec += interval
        if(sec >= 60):
            sec -= 60
            min += 1
            if(min >= 60):
                min -= 60
                hr += 1

        if(hr < 10):
            msg += '0' + str(hr) + ':'
        else:
            msg += str(hr) + ':'
        if(min < 10):
            msg += '0' + str(min) + ':'
        else:
            msg += str(min) + ':'
        if(sec < 10):
            msg += '0' + str(sec) + ',000\n'
        else:
            msg += str(sec) +  ',000\n'

        msg += sentence + '\n\n'
        if(sentence != ''):
            print(unicode(msg, 'utf-8'))
            outputFile.write(msg)
        lineNum += 1

    outputFile.close()


window = tk.Tk()
screen_width = window.winfo_screenwidth()
screen_height = window.winfo_screenheight()
window_width, window_height = 400, 120
position_top = int(screen_height/2 - window_height/2)
position_right = int(screen_width/2 - window_width/2)

window.title('txt2srt')
window.geometry(str(window_width) + 'x' + str(window_height) + '+' + str(position_right) + '+' + str(position_top/2))
window.geometry('400x120')
window.configure(background='white')

fontStyle = tkFont.Font(family="Lucida Grande", size=20)
header_label = tk.Label(window, text='SRT產生器', font=fontStyle)
header_label.pack()

# 以下為 interval_frame 群組
interval_frame = tk.Frame(window)
# 向上對齊父元件
interval_frame.pack(side=tk.TOP)
interval_label = tk.Label(interval_frame, text='請輸入間隔秒數：')
interval_label.pack(side=tk.LEFT)
interval_entry = tk.Entry(interval_frame)
interval_entry.insert(0, '5')
interval_entry.pack(side=tk.LEFT)

# 以下為 path_frame 群組
ttk.Style().configure('red.TButton', foreground='red')
path_frame = tk.Frame(window)
path_frame.pack(side=tk.TOP)
path_label = tk.Label(path_frame)
path_label.pack()

# 以下為 button_frame 群組
button_frame = tk.Frame(window)
button_frame.pack(side=tk.TOP)
path_button = tk.Button(button_frame, text='讀取檔案', command=get_txt_path)
path_button.pack(side=tk.LEFT)
generate_btn = ttk.Button(button_frame, text='產生字幕', style='red.TButton', command=generate_srt)
generate_btn.pack(side=tk.LEFT)

window.mainloop()
