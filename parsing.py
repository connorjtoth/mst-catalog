#!/usr/bin/env python
# -*- coding: utf-8 -*-

import urllib2
from bs4 import BeautifulSoup
import time    

# url of the page that has the menu on it
ROOT_ADDR = 'http://catalog.mst.edu';
MENU_ADDR = 'http://catalog.mst.edu/undergraduate/degreeprogramsandcourses/#text';




def get_html_from_url ( url ):

  # open a connection to the url                              
  socket = urllib2.urlopen( url );

  # get the source code of the web-page
  html_data = socket.read();

  # close the connection to the url
  socket.close();

  # return the HTML source code
  return html_data;


def get_urls ( ):
  
  # get the html from the menu page
  pagedata = get_html_from_url(MENU_ADDR);

  # set up the parser so we can get info
  soup = BeautifulSoup(pagedata, 'html.parser');

  # set up an aggregator to store the urls
  urls = [];

  # get the list of department program links
  menu_list = soup.find('ul', id='/undergraduate/degreeprogramsandcourses/');

  # get each element of that list
  menu_list = menu_list.find_all('li');

  # for each element of that list
  for item in menu_list:

    # the relative URL is the anchor element's href property
    url = item.find('a')['href'];

    # on the offchance that there may be some non-relative
    # only if the URL starts with a '/' is prepended with the
    # root URL
    if url[0] == '/':
      url = ROOT_ADDR + url;

    # push the new URL to the aggregation of urls
    urls += [url];

  # return all URLs
  return urls;


def get_class_tuples_from_html ( html ):
  
  # set up the parser so we can get info
  soup = BeautifulSoup(html, 'html.parser');

  # find all courseblocks in which each course is described
  blocks = soup.find_all('div', class_='courseblock');

  # set up an aggregator of course tuples
  tuples = [];

  # for each of these split into component parts
  for block in blocks:

    # differentiate the two main elements of the block
    titleblock = block.find(class_='courseblocktitle');
    descblock = block.find(class_='courseblockdesc');

    # obtain the dept and course number
    dept_plus_num = urllib2.unquote(titleblock['id']);
    
    # obtain the course name
    course_name = '';
    for string in titleblock.strings:
      course_name += string;
    
    # obtain the description
    description = '';
    for string in descblock.strings:
      description += string;
    
    # push the new tuple to the aggregation
    tuples += [( dept_plus_num, course_name, description )];

  # return all tuples
  return tuples;


def main ( ):
  # get the urls we need to visit to get class information
  urls = get_urls();

  # for each url we visit
  for url in urls:
    html = get_html_from_url(url);
    tuples = get_class_tuples_from_html(html);
    print(tuples);
    print('\n');